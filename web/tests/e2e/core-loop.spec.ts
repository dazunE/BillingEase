import { expect, test, type Page } from "@playwright/test";

/**
 * The whole loop, end to end, against a fresh in-memory database with
 * "today" fixed at 2026-10-04: sign up → set up with a sample month → nudge a
 * late customer → bill someone → the customer pays online → sort card
 * charges → approve payroll → record an expense → change the tax rate →
 * read the reports. The three numbers must move as money moves.
 */

async function dollars(page: Page, label: RegExp) {
  const card = page.getByRole("link", { name: label }).first();
  const text = await card.innerText();
  const m = text.match(/\$[\d,]+/);
  if (!m) throw new Error(`No amount in: ${text}`);
  return Number(m[0].replace(/[$,]/g, ""));
}

test("the three-numbers loop works end to end", async ({ page }) => {
  // Sign up
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Maya Chen");
  await page.getByLabel("Work email").fill(`maya+${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByLabel(/I agree/).check();
  await page.getByRole("button", { name: "Create account" }).click();

  // Set up with the sample month
  await page.waitForURL(/\/onboarding/);
  await page.getByLabel("Business name").fill("Northwind Studio");
  await page.getByRole("button", { name: /Show me my three numbers/ }).click();
  await page.waitForURL(/\/app$/, { timeout: 90_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("on track to keep");
  const comingIn0 = await dollars(page, /^Coming in/);

  // Nudge a late customer → reminder lands in the outbox
  await page.getByRole("button", { name: "Send a friendly nudge" }).first().click();
  await expect(page.getByRole("status")).toContainText("Reminder sent");

  // Bill someone
  await page.goto("/app/in");
  await page.getByLabel("Customer").selectOption({ label: "Greenline Architects" });
  await page.getByLabel("Amount in dollars").fill("1250");
  await page.getByLabel("What it's for").fill("Logo refresh");
  // due inside October, so it counts toward this month's "on the way"
  await page.getByLabel("Due in").selectOption("14");
  await expect(page.getByLabel("Invoice preview")).toContainText("1,250");
  await page.getByRole("button", { name: /Send invoice/ }).click();
  await expect(page.getByRole("status")).toContainText(/Sent INV-/);

  // Home: Coming in went up by the new invoice (due within the month)
  await page.goto("/app");
  expect(await dollars(page, /^Coming in/)).toBe(comingIn0 + 1250);

  // The customer pays online from the emailed link (sandbox card)
  await page.goto("/app/outbox");
  const payLink = await page.locator("a[href*='/i/']").first().getAttribute("href");
  expect(payLink).toBeTruthy();
  const url = new URL(payLink!, page.url());
  await page.goto(url.pathname);
  await expect(page.getByText(/Test mode/)).toBeVisible();
  await page.locator("input[name=name]").fill("Daniel Okafor");
  await page.locator("input[name=cardNumber]").fill("4242 4242 4242 4242");
  await page.locator("input[name=expiry]").fill("12/29");
  await page.locator("input[name=cvc]").fill("123");
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await expect(page.getByText(/thank you/i).first()).toBeVisible();

  // Sort the new card charges
  await page.goto("/app/out#sort");
  for (let i = 0; i < 4; i++) {
    const sorter = page.locator("#sort");
    await sorter.getByRole("button").filter({ hasNotText: /Back|Other/ }).first().click();
    await page.waitForTimeout(400);
  }
  await expect(page.locator("#sort")).toContainText(/All sorted|Nothing to sort/);

  // Approve payroll
  await page.goto("/app");
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("status")).toContainText("Payroll approved");

  // Record an expense → Going out goes up
  const goingOut0 = await dollars(page, /^Going out/);
  await page.goto("/app/out#expense");
  const expense = page.locator("#expense");
  await expense.locator("input[name=amount]").fill("42.50");
  await expense.locator("input[name=description]").fill("Client lunch");
  await expense.getByRole("button", { name: /Add|Record|Save/ }).first().click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.goto("/app");
  // headline numbers are rounded to whole dollars, so $42.50 shows as +42 or +43
  const goingOut1 = await dollars(page, /^Going out/);
  expect(goingOut1 - goingOut0).toBeGreaterThanOrEqual(42);
  expect(goingOut1 - goingOut0).toBeLessThanOrEqual(43);

  // Change the tax rate and see it on Home
  await page.goto("/app/keep");
  await page.getByRole("button", { name: "30%" }).click();
  await page.goto("/app");
  await expect(page.getByRole("link", { name: /^Yours to keep/ })).toContainText("(30%)");

  // Reports read straight from the ledger and balance
  await page.goto("/app/reports/balance-sheet");
  await expect(page.getByText(/Balanced/)).toBeVisible();
  await page.goto("/app/reports/profit-and-loss?preset=this-year");
  await expect(page.getByText(/Net profit|Net loss/i).first()).toBeVisible();
  await page.goto("/app/ledger");
  await expect(page.getByText(/balance/i).first()).toBeVisible();
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
  const res = await page.request.get("/app/reports/profit-and-loss/csv", { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(res.status());
});
