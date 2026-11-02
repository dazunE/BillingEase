import { expect, test } from "@playwright/test";

/**
 * The kinds of invoice: New invoice asks what kind, then time and materials (time with dates and
 * who, materials with a markup, each subtotalled) and a fixed price (the scope and one amount).
 */

const API = "http://127.0.0.1:4200";
const WEB = "http://127.0.0.1:3200";

test("UK: a time and materials invoice and a fixed price invoice", async ({ page, request, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // A VAT-registered UK owner with one customer, signed in.
  const signUp = await (await request.post(`${API}/auth/sign-up`, { data: { name: "Ellie Harper", email: `types-${Date.now()}@example.com`, password: "correct horse battery" } })).json();
  const auth = { authorization: `Bearer ${signUp.token}` };
  const biz = await (await request.post(`${API}/businesses`, { headers: auth, data: { country: "uk", kind: "sole_trader", name: "Harper Plumbing", ownerName: "Ellie Harper", vatRegistered: true, vatNumber: "GB123456789" } })).json();
  await request.post(`${API}/customers`, { headers: { ...auth, "x-business-id": biz.id }, data: { name: "Kirkstall Brewing Co" } });
  await context.addCookies([{ name: "be_session", value: signUp.token, url: WEB }]);

  // New invoice asks what kind; Recurring goes to repeating invoices.
  await page.goto("/app/in/invoices/new");
  await expect(page.getByRole("heading", { name: "What kind of VAT invoice?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Recurring/ })).toHaveAttribute("href", "/app/in/repeating/new");

  // Time and materials.
  await page.getByRole("link", { name: /^Time and materials/ }).click();
  await page.getByRole("combobox", { name: "Customer", exact: true }).selectOption({ label: "Kirkstall Brewing Co" });
  await page.getByLabel("Task", { exact: true }).fill("Replace boiler");
  await page.getByLabel("Who").fill("Ellie");
  await page.getByLabel("Hours").fill("7.5");
  await page.getByLabel(/^Rate per hour/).fill("60");
  await page.getByLabel("Material", { exact: true }).fill("Copper pipe");
  await page.getByLabel(/^Quantity/).fill("4");
  await page.getByLabel(/^Cost/).fill("10");
  await page.getByLabel("Markup %").fill("20");
  const preview = page.getByLabel(/preview/);
  // 7.5 h × £60 = £450; 4 × (£10 + 20%) = £48.
  await expect(preview.getByTestId("subtotal-time")).toContainText("£450.00");
  await expect(preview.getByTestId("subtotal-materials")).toContainText("£48.00");
  await expect(preview.getByText("Hours", { exact: true })).toBeVisible();
  await expect(page.getByTestId("editor-total")).toHaveText("£597.60");
  await page.getByRole("button", { name: "Save and mark sent" }).click();
  await expect(page.getByText("HP-0001").first()).toBeVisible();
  const tmPreview = page.getByLabel(/preview/);
  await expect(tmPreview.getByText("Time", { exact: true })).toBeVisible();
  await expect(tmPreview.getByText("Materials", { exact: true })).toBeVisible();
  await expect(tmPreview.getByText(/Ellie/).first()).toBeVisible();
  await page.waitForURL(/\/app\/in\/invoices\/[0-9a-f-]{36}/);
  const tmPdf = await page.request.get(`${page.url().split("?")[0]}/pdf`);
  expect(tmPdf.status()).toBe(200);

  // Fixed price: the scope and one amount, no quantities.
  await page.goto("/app/in/invoices/new?type=fixed");
  await page.getByRole("combobox", { name: "Customer", exact: true }).selectOption({ label: "Kirkstall Brewing Co" });
  await page.getByLabel("What's included").fill("Bathroom refit\nNew suite, tiling and fitting");
  await page.getByLabel(/^Price/).fill("2400");
  await expect(page.getByTestId("editor-total")).toHaveText("£2,880.00");
  await expect(page.getByLabel(/preview/).getByText("Qty", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Save and mark sent" }).click();
  await expect(page.getByText("HP-0002").first()).toBeVisible();

  expect(errors).toEqual([]);
});
