import { expect, test } from "@playwright/test";

/**
 * The bottom island and Your business: the island follows the section you're in, the owner
 * invites an accountant, sees where they're signed in, imports customers and exports them.
 */

const API = "http://127.0.0.1:4200";
const WEB = "http://127.0.0.1:3200";

test("UK: the bottom island, People and access, and Security and data", async ({ page, request, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const signUp = await (await request.post(`${API}/auth/sign-up`, { data: { name: "Ellie Harper", email: `biz-${Date.now()}@example.com`, password: "correct horse battery" } })).json();
  const auth = { authorization: `Bearer ${signUp.token}` };
  const biz = await (await request.post(`${API}/businesses`, { headers: auth, data: { country: "uk", kind: "sole_trader", name: "Harper Studio", ownerName: "Ellie Harper", vatRegistered: false } })).json();
  await request.post(`${API}/customers`, { headers: { ...auth, "x-business-id": biz.id }, data: { name: "Ochre Café", email: "hello@ochre.example" } });
  await context.addCookies([{ name: "be_session", value: signUp.token, url: WEB }]);

  // Home: the island shows the six sections.
  await page.goto("/app");
  const sections = page.getByRole("navigation", { name: "Sections" });
  await expect(sections.getByRole("link")).toHaveCount(6);
  await expect(sections.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");

  // Into Coming in: the island becomes its pages; ← shows the sections again.
  await sections.getByRole("link", { name: "Coming in" }).click();
  const inPages = page.getByRole("navigation", { name: "Coming in pages" });
  await expect(inPages.getByRole("link", { name: "Customers" })).toBeVisible();
  await inPages.getByRole("link", { name: "Customers" }).click();
  await expect(page).toHaveURL(/\/app\/in\/customers$/);
  await expect(page.getByRole("navigation", { name: "Coming in pages" }).getByRole("link", { name: "Customers" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Show all sections" }).click();
  await page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Business" }).click();

  // Your business → People and access: invite an accountant.
  const bizPages = page.getByRole("navigation", { name: "Business pages" });
  await bizPages.getByRole("link", { name: "People and access" }).click();
  await expect(page.getByRole("heading", { name: "People and access", level: 1 })).toBeVisible();
  await page.getByLabel("Their email").fill("priya@daleandshaw.example");
  await page.getByRole("button", { name: "Send invitation" }).click();
  await expect(page.getByRole("status")).toContainText("Invitation sent to priya@daleandshaw.example");
  await expect(page.getByText("priya@daleandshaw.example").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel the invitation to priya@daleandshaw.example" })).toBeVisible();

  // Security and data: this device, import customers by pasting rows, export them.
  await page.getByRole("navigation", { name: "Business pages" }).getByRole("link", { name: "Security and data" }).click();
  await expect(page.getByText("This device")).toBeVisible();
  await page.getByRole("button", { name: "Or paste the rows instead" }).click();
  await page.getByLabel("Or paste the rows").fill("name,email\nKirkstall Brewing Co,accounts@kirkstall.example\nOchre Café,hello@ochre.example");
  await page.getByRole("button", { name: "Import customers" }).click();
  await expect(page.getByRole("status")).toContainText("1 customer added, 1 skipped");

  const csv = await page.request.get("/app/settings/security/export/customers");
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(csv.headers()["content-disposition"]).toContain("harper-studio-customers-2026-10-11.csv");
  const text = await csv.text();
  expect(text).toContain("Kirkstall Brewing Co,,accounts@kirkstall.example");
  expect(text).toContain("Ochre Café");

  // Yours to keep has its own page now.
  await page.goto("/app/keep");
  await expect(page.getByRole("navigation", { name: "Yours to keep pages" }).getByRole("link", { name: "Bank check" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /estimate$/ })).toBeVisible();

  expect(errors).toEqual([]);
});
