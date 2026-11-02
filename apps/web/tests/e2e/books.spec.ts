import { expect, test } from "@playwright/test";

/**
 * Yours to keep → your books: a UK quarter's figures and checks, marking it sent (which locks
 * it), the profit and loss with its CSV, and Sri Lanka's VAT and SSCL month.
 */

const API = "http://127.0.0.1:4200";
const WEB = "http://127.0.0.1:3200";

async function owner(request: import("@playwright/test").APIRequestContext, country: "uk" | "lk") {
  const s = await (await request.post(`${API}/auth/sign-up`, { data: { name: "Owner", email: `books-${country}-${Date.now()}@example.com`, password: "correct horse battery" } })).json();
  const auth = { authorization: `Bearer ${s.token}` };
  const body = country === "uk"
    ? { country, kind: "sole_trader", name: "Harper Studio", ownerName: "Ellie Harper", vatRegistered: false }
    : { country, kind: "sole_proprietor", name: "Serendib Design Studio", ownerName: "Ayesha Fernando", taxId: "104563218", vatRegistered: true, vatNumber: "104563218-7000", ssclRegistered: true };
  const biz = await (await request.post(`${API}/businesses`, { headers: auth, data: body })).json();
  const h = { ...auth, "x-business-id": biz.id };
  const c = await (await request.post(`${API}/customers`, { headers: h, data: { name: "Ochre Café" } })).json();
  const inv = await (await request.post(`${API}/invoices`, { headers: h, data: { customerId: c.id, issueDate: "2026-09-08", lines: [{ description: "Window graphics", quantityMilli: 1000, unitPrice: country === "uk" ? 45000 : 10000000 }] } })).json();
  await request.post(`${API}/invoices/${inv.id}/issue`, { headers: h, data: { email: false } });
  await request.post(`${API}/out/expenses`, { headers: h, data: { spentOn: "2026-09-10", payee: "Ryman", categoryId: "office", gross: 2400, method: "Card" } });
  return s.token as string;
}

test("UK: a quarter's figures, marking it sent, and the profit and loss", async ({ page, request, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.addCookies([{ name: "be_session", value: await owner(request, "uk"), url: WEB }]);

  await page.goto("/app/keep");
  await page.getByRole("navigation", { name: "Your books" }).getByRole("link", { name: /^Quarters/ }).click();
  await expect(page).toHaveURL(/\/app\/keep\/quarters$/);
  // Q2 is the latest quarter still to send.
  await expect(page.getByText("Making Tax Digital · 2026/27 · Q2")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Q2 by HMRC category" })).toBeVisible();
  await expect(page.getByText("Phone, internet and office")).toBeVisible();

  await page.getByRole("button", { name: "Mark Q2 as sent" }).click();
  await expect(page.getByText("Tick to confirm the figures were sent")).toBeVisible();
  await page.getByLabel("Reference (optional)").fill("MTD-0042");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Mark Q2 as sent" }).click();
  await expect(page.getByRole("status")).toContainText("Q2 2026/27 update marked as sent and locked.");
  // Q1 is now the one still to send; Q2 shows as sent.
  await page.reload();
  await expect(page.getByText("Making Tax Digital · 2026/27 · Q1")).toBeVisible();
  await page.getByRole("link", { name: /^Q2/ }).click();
  await expect(page.getByText(/reference MTD-0042/)).toBeVisible();

  await page.getByRole("navigation", { name: "Yours to keep pages" }).getByRole("link", { name: "Reports" }).click();
  await expect(page.getByRole("heading", { name: "Profit and loss" })).toBeVisible();
  await expect(page.getByText("£450.00").first()).toBeVisible();
  const csv = await page.request.get("/app/keep/reports/export?from=2026-04-06&to=2026-10-11");
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(await csv.text()).toContain("Total,,Profit,,,426.00");

  await page.getByRole("link", { name: "Balance sheet" }).click();
  await expect(page.getByText("What the business is worth to you")).toBeVisible();
  expect(errors).toEqual([]);
});

test("Sri Lanka: the September VAT and SSCL return", async ({ page, request, context }) => {
  await context.addCookies([{ name: "be_session", value: await owner(request, "lk"), url: WEB }]);
  await page.goto("/app/keep/tax-periods?p=2026-09");
  await expect(page.getByText("VAT and SSCL · September 2026")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The return, line by line" })).toBeVisible();
  await expect(page.getByText("SSCL at 2.5%")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark September filed" })).toBeVisible();
});
