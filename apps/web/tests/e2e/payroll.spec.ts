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
  await page.getByLabel("NIC number").fill("199012304567");
  await page.getByLabel("EPF member number").fill("1042");
  await page.getByLabel("Bank", { exact: true }).fill("Commercial Bank");
  await page.getByLabel("Branch").fill("Kollupitiya");
  await page.getByLabel("Account number").fill("8001 2345 6789");
  await page.getByRole("button", { name: "Add to payroll" }).click();

  // Worked out as you look: EPF 8% Rs 27,200, APIT Rs 29,500, net Rs 283,300.
  await expect(page.getByText("Rs 283,300").first()).toBeVisible();
  await expect(page.getByText("−Rs 29,500").first()).toBeVisible();
  await page.getByRole("button", { name: "Review and approve" }).click();
  await expect(page).toHaveURL(/\/app\/out\/payroll\/[0-9a-f-]{36}$/);
  await expect(page.getByText("October 2026 payroll · approved by Owner")).toBeVisible();
  await expect(page.getByText("APIT for October")).toBeVisible();

  // The schedules to pay and file: EPF C form, ETF, APIT and the bank transfer list.
  const runUrl = page.url();
  const sched = page.getByRole("region", { name: "Schedules to pay and file yourself" });
  await expect(sched.getByText("EPF contributions (C form style)")).toBeVisible();
  const epfRow = sched.getByRole("row", { name: /Kasun Perera/ });
  await expect(epfRow).toContainText("199012304567");
  await expect(epfRow).toContainText("1042");
  await expect(epfRow).toContainText("340,000.00");
  await expect(epfRow).toContainText("27,200.00");
  await expect(epfRow).toContainText("40,800.00");
  await expect(epfRow).toContainText("68,000.00");
  await sched.getByRole("button", { name: "ETF" }).click();
  await expect(sched.getByRole("row", { name: /Kasun Perera/ })).toContainText("10,200.00");
  await sched.getByRole("button", { name: "APIT" }).click();
  await expect(sched.getByRole("row", { name: /Kasun Perera/ })).toContainText("29,500.00");
  await expect(sched.getByText("Employer TIN 104563218")).toBeVisible();
  await sched.getByRole("button", { name: "Bank transfer list" }).click();
  const bankRow = sched.getByRole("row", { name: /Kasun Perera/ });
  await expect(bankRow).toContainText("Commercial Bank");
  await expect(bankRow).toContainText("8001 2345 6789");
  await expect(bankRow).toContainText("283,300.00");
  await sched.getByRole("button", { name: "Copy (CSV)" }).click();
  await expect(sched.getByLabel("CSV, ready to paste into a spreadsheet")).toHaveValue(/Kasun Perera,Commercial Bank,Kollupitiya,8001 2345 6789,283300\.00/);
  const runId = /payroll\/([0-9a-f-]{36})/.exec(runUrl)![1];
  const epfCsv = await page.request.get(`/app/out/payroll/${runId}/schedules/epf`);
  expect(epfCsv.headers()["content-type"]).toContain("text/csv");
  expect(epfCsv.headers()["content-disposition"]).toContain("epf-2026-10.csv");
  const epfText = await epfCsv.text();
  expect(epfText).toContain("Name,NIC,Member no,Total earnings,Employee 8%,Employer 12%,Total");
  expect(epfText).toContain("Kasun Perera,199012304567,1042,340000.00,27200.00,40800.00,68000.00");
  expect(epfText).toContain("Total,,,340000.00,27200.00,40800.00,68000.00");
  expect((await page.request.get(`/app/out/payroll/${runId}/schedules/nope`)).status()).toBe(404);

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

  // The year-end pack has the year's payroll for each person.
  await page.goto("/app/keep/year-end");
  const year = page.getByRole("region", { name: "Payroll for the year" });
  const kasun = year.getByRole("row", { name: /Kasun Perera/ });
  await expect(kasun).toContainText("199012304567");
  await expect(kasun).toContainText("340,000.00");
  await expect(kasun).toContainText("29,500.00");
  await expect(kasun).toContainText("283,300.00");
  await expect(page.getByText("APIT deducted").first()).toBeVisible();
  const ye = await page.request.get("/app/keep/year-end/payroll");
  expect(ye.headers()["content-type"]).toContain("text/csv");
  const yeText = await ye.text();
  expect(yeText).toContain("Name,NIC,Months,Gross pay,APIT deducted,EPF employee 8%,EPF employer 12%,ETF 3%,Net pay");
  expect(yeText).toContain("Kasun Perera,199012304567,1,340000.00,29500.00,27200.00,40800.00,10200.00,283300.00");
  expect(errors).toEqual([]);
});

test("UK: a pay run from the payroll software owes HMRC by the 22nd", async ({ page, request, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.addCookies([{ name: "be_session", value: await owner(request, "uk"), url: WEB }]);
  await page.goto("/app/out/payroll?add=1");

  // Check the figures before there's a run: a rough calculator, clearly not payroll.
  const check = page.getByRole("region", { name: "Check the figures" });
  await expect(check.getByText("A check, not payroll")).toBeVisible();
  await check.getByLabel("Gross pay for the month").fill("3000");
  await expect(check.getByRole("row", { name: /^PAYE/ })).toContainText("£390.35");
  await expect(check.getByRole("row", { name: /^Employee NI/ })).toContainText("£156.20");
  await expect(check.getByRole("row", { name: /^Employee pension/ })).toContainText("£124.00");
  await expect(check.getByRole("row", { name: /^Net pay/ })).toContainText("£2,329.45");
  await expect(check.getByRole("row", { name: /^Employer NI/ })).toContainText("£387.50");
  await expect(check.getByRole("row", { name: /^To HMRC/ })).toContainText("£934.05");
  await check.getByRole("button", { name: "Not enrolled" }).click();
  await expect(check.getByRole("row", { name: /^Employee pension/ })).toContainText("£0.00");

  const person = page.locator("#person");
  await person.getByLabel("Name", { exact: true }).fill("Tom Whitaker");
  await person.getByLabel(/^Tax code/).fill("1257L");
  await person.getByLabel(/^In the workplace pension/).check();
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

  // On the run, the check holds Tom's line against what it expects.
  const runCheck = page.getByRole("region", { name: "Check the figures" });
  await expect(runCheck.getByLabel("Compare with")).toHaveValue(/.+/);
  await expect(runCheck.getByRole("row", { name: /^PAYE/ })).toContainText("£14.35");
  await expect(runCheck.getByText("Close to your Tom Whitaker, October 2026 figures for £1,120.00 gross. Nothing stands out.")).toBeVisible();
  await runCheck.getByLabel("Tax code").fill("BR");
  await expect(runCheck.getByRole("row", { name: /^PAYE/ })).toContainText("£224.00");
  await expect(runCheck.getByText(/differ by more than £1 on PAYE\. Worth a look/)).toBeVisible();

  // The year-end pack: PAYE, NI and pension per person.
  await page.goto("/app/keep/year-end");
  const year = page.getByRole("region", { name: "Payroll for the year" });
  const tom = year.getByRole("row", { name: /Tom Whitaker/ });
  await expect(tom).toContainText("1,120.00");
  await expect(tom).toContainText("14.35");
  await expect(tom).toContainText("105.50");
  await expect(tom).toContainText("1,069.85");
  const ye = await (await page.request.get("/app/keep/year-end/payroll")).text();
  expect(ye).toContain("Name,NI number,Pay runs,Gross pay,PAYE,Employee NI,Employer NI,Employee pension,Employer pension,Net pay");
  expect(ye).toContain("Tom Whitaker,,1,1120.00,14.35,5.80,105.50,30.00,18.00,1069.85");
  expect(errors).toEqual([]);
});
