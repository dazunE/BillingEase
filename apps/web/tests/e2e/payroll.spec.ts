import { expect, test } from "@playwright/test";

/**
 * Payroll: in Sri Lanka, add someone, work out and approve October, open a payslip and mark
 * APIT paid. In the UK, enter a pay run from the payroll software and see what's owed to HMRC.
 */

const API = "http://127.0.0.1:4200";
const WEB = "http://127.0.0.1:3200";

async function owner(request: import("@playwright/test").APIRequestContext, country: "uk" | "lk") {
  const s = await (await request.post(`${API}/auth/sign-up`, { data: { name: "Owner", email: `payroll-${country}-${Date.now()}@example.com`, password: "correct horse battery" } })).json();
  const body = country === "uk"
    ? { country, kind: "sole_trader", name: "Harper Studio", ownerName: "Ellie Harper", vatRegistered: false }
    : { country, kind: "sole_proprietor", name: "Serendib Design Studio", ownerName: "Ayesha Fernando", taxId: "104563218", vatRegistered: false };
  await request.post(`${API}/businesses`, { headers: { authorization: `Bearer ${s.token}` }, data: body });
  return s.token as string;
}

test("Sri Lanka: add someone, approve October payroll, a payslip and paying APIT", async ({ page, request, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.addCookies([{ name: "be_session", value: await owner(request, "lk"), url: WEB }]);

  await page.goto("/app/out/payroll");
  await expect(page.getByRole("heading", { name: "October 2026 payroll" })).toBeVisible();
  await page.getByLabel("Name", { exact: true }).fill("Kasun Perera");
  await page.getByLabel("Job").fill("Senior designer");
  await page.getByLabel("Basic pay a month (LKR)").fill("320000");
  await page.getByLabel("Allowance 1 name").fill("Transport");
  await page.getByLabel("Allowance 1 amount").fill("20000");
  await page.getByRole("button", { name: "Add to payroll" }).click();

  // Worked out as you look: EPF 8% Rs 27,200, APIT Rs 29,500, net Rs 283,300.
  await expect(page.getByText("Rs 283,300").first()).toBeVisible();
  await expect(page.getByText("−Rs 29,500").first()).toBeVisible();
  await page.getByRole("button", { name: "Review and approve" }).click();
  await expect(page).toHaveURL(/\/app\/out\/payroll\/[0-9a-f-]{36}$/);
  await expect(page.getByText("October 2026 payroll · approved by Owner")).toBeVisible();
  await expect(page.getByText("APIT for October")).toBeVisible();

  await page.getByRole("link", { name: "Payslip" }).click();
  await expect(page.getByRole("heading", { name: "Payslip" })).toBeVisible();
  await expect(page.getByText("Rs 283,300")).toBeVisible();

  await page.goto("/app/out/payroll");
  const apit = page.getByRole("listitem").filter({ hasText: "APIT for October" });
  await apit.getByRole("button", { name: "Mark paid" }).click();
  await apit.getByLabel("Reference").fill("IRD-77");
  await apit.getByRole("button", { name: "Save" }).click();
  // Paid: it leaves the list of what's still to pay.
  await expect(page.getByRole("listitem").filter({ hasText: "APIT for October" })).toHaveCount(0);
  await expect(page.getByText("EPF for October (8% + 12%)").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("UK: a pay run from the payroll software owes HMRC by the 22nd", async ({ page, request, context }) => {
  await context.addCookies([{ name: "be_session", value: await owner(request, "uk"), url: WEB }]);
  await page.goto("/app/out/payroll?add=1");
  await page.getByLabel("Name", { exact: true }).fill("Tom Whitaker");
  await page.getByLabel(/^Tax code/).fill("1257L");
  await page.getByRole("button", { name: "Add to payroll" }).click();
  await expect(page.getByRole("heading", { name: "October 2026 pay run" })).toBeVisible();
  await page.getByLabel("Gross pay", { exact: true }).fill("1120");
  await page.getByLabel("PAYE", { exact: true }).fill("14.35");
  await page.getByLabel("Employee NI", { exact: true }).fill("5.80");
  await page.getByLabel("Employee pension", { exact: true }).fill("30");
  await page.getByLabel("Employer NI", { exact: true }).fill("105.50");
  await page.getByLabel("Employer pension", { exact: true }).fill("18");
  await expect(page.getByText("£1,069.85")).toBeVisible();
  await page.getByRole("button", { name: "Approve the pay run" }).click();
  await expect(page.getByText("PAYE and NI for October")).toBeVisible();
  await expect(page.getByText("due 22 Nov 2026").first()).toBeVisible();
});
