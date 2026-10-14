import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * The first-month journey in each country, through the real web app and API:
 * sign up → set up a VAT-registered business → add a customer → send an invoice →
 * record the payment → record an expense → Home shows the three numbers without VAT
 * (and SSCL in Sri Lanka) → Ask explains it isn't set up without a key.
 */

const COUNTRIES = {
  uk: {
    country: "United Kingdom", owner: "Ellie Harper", business: "Harper Studio", vatLabel: "VAT number", vatNumber: "GB123456789",
    customer: "Ochre Café", price: "1000", invoiceTitle: "VAT invoice", number: "HS-0001",
    expense: { amount: "120", payee: "EE", category: "Phone, internet and office", vatButton: /Work it out at 20%/ },
    received: "£1,000", paid: "£100",
  },
  lk: {
    country: "Sri Lanka", owner: "Ayesha Fernando", business: "Serendib Design Studio", vatLabel: "VAT registration number", vatNumber: "104563218-7000",
    customer: "Colombo Dental Clinic", price: "100000", invoiceTitle: "Tax Invoice", number: "SDS-0001",
    expense: { amount: "11800", payee: "SLT-Mobitel", category: "Electricity, water and phone", vatButton: /Work it out at 18%/ },
    received: "Rs 100,000", paid: "Rs 10,000",
  },
} as const;

/** Clicks Continue through setup's steps until the target shows. */
async function continueUntil(page: Page, target: Locator) {
  for (let i = 0; i < 6 && !(await target.isVisible()); i++) await page.getByRole("button", { name: "Continue" }).click();
  await expect(target).toBeVisible();
}

async function openNew(page: Page, item: RegExp) {
  await page.locator("header summary", { hasText: "New" }).click();
  await page.locator("header a", { hasText: item }).click();
}

for (const [code, c] of Object.entries(COUNTRIES)) {
  test(`${c.country}: first month from sign-up to the three numbers`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    // Sign up, choosing the country first.
    await page.goto("/sign-up");
    await page.getByLabel(c.country).check();
    await page.getByLabel("Your name").fill(c.owner);
    await page.getByLabel("Email").fill(`${code}-${Date.now()}@example.com`);
    await page.getByLabel("Password").fill("correct horse battery");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();

    // Set up: VAT registered (and SSCL in Sri Lanka).
    await page.waitForURL(/\/setup/);
    // Setup asks one step at a time: the business, what it is, then tax registration, then a check.
    await page.getByLabel("Business name").fill(c.business);
    const vatYes = page.locator("input[name=vatRegistered][value=on]");
    await continueUntil(page, vatYes);
    await vatYes.check();
    await page.getByLabel(c.vatLabel).fill(c.vatNumber);
    if (code === "lk") await page.locator("input[name=ssclRegistered][value=on]").check();
    const setUp = page.getByRole("button", { name: "Set up my books" });
    await continueUntil(page, setUp);
    await setUp.click();
    await page.waitForURL(/\/app$/);
    await expect(page.locator("header")).toContainText(c.business);

    // A customer.
    await openNew(page, /Add a customer/);
    const form = page.locator("#new");
    await form.getByLabel("Customer name").fill(c.customer);
    await form.getByLabel("Email for invoices").fill("accounts@example.com");
    await form.getByRole("button", { name: "Add customer", exact: true }).click();
    await expect(page.getByText("Customer added")).toBeVisible();

    // An invoice, sent by email.
    await openNew(page, /New invoice/);
    await page.getByRole("combobox", { name: "Customer", exact: true }).selectOption({ label: c.customer });
    await page.getByLabel("Line 1", { exact: true }).fill("Design work");
    await page.locator("li").filter({ has: page.getByLabel("Line 1", { exact: true }) }).getByLabel(/^Price/).fill(c.price);
    await expect(page.getByLabel(/preview/).getByText(c.invoiceTitle, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Save and send/ }).click();
    await expect(page.getByText(c.number).first()).toBeVisible();

    // Paid in full by bank transfer.
    const pay = page.locator("#pay");
    await pay.getByLabel("How they paid").selectOption("Bank transfer");
    await pay.getByRole("button", { name: "Record payment" }).click();
    await expect(page.getByText("Paid in full").first()).toBeVisible();

    // An expense with input VAT.
    await openNew(page, /Record an expense/);
    const exp = page.locator("#expense");
    await exp.getByLabel("Amount paid").fill(c.expense.amount);
    await exp.getByLabel("Paid to").fill(c.expense.payee);
    await exp.locator("label", { hasText: c.expense.category }).first().click();
    await exp.getByRole("button", { name: c.expense.vatButton }).click();
    await exp.getByRole("button", { name: "Add expense" }).click();
    await expect(page.getByText("Expense recorded.")).toBeVisible();
    await expect(page.locator("main")).toContainText(`${c.paid} paid`);

    // Home: the three numbers leave out VAT and SSCL.
    await page.goto("/app?period=month");
    const main = page.locator("main");
    await expect(main).toContainText(c.received);
    await expect(main).toContainText(c.paid);
    await expect(main).toContainText("Yours to keep");

    // Ask without an API key says so plainly.
    await page.goto("/app/ask");
    await expect(page.getByText("Ask isn't set up yet")).toBeVisible();

    expect(errors).toEqual([]);
  });
}
