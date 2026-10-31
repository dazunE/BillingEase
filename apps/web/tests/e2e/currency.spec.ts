import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * A UK business with a client abroad: the customer's usual currency is US dollars, so their
 * invoice is in dollars at a rate the owner types (rates lookups are off in these tests), and the
 * books, the PDF and the payment all show what it is in pounds.
 */

async function continueUntil(page: Page, target: Locator) {
  for (let i = 0; i < 6 && !(await target.isVisible()); i++) await page.getByRole("button", { name: "Continue" }).click();
  await expect(target).toBeVisible();
}

async function openNew(page: Page, item: RegExp) {
  await page.locator("header summary", { hasText: "New" }).click();
  await page.locator("header a", { hasText: item }).click();
}

const SHOTS = process.env.E2E_SHOTS_DIR;

test("UK: invoicing a US client in dollars, booked in pounds", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/sign-up");
  await page.getByLabel("Where is your business based?").selectOption("uk");
  await expect(page.getByText("HMRC · Making Tax Digital")).toBeVisible();
  await page.getByLabel("Your name").fill("Ellie Harper");
  await page.getByLabel("Email").fill(`fx-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/setup/);
  await expect(page.getByLabel("Where is your business based?")).toHaveValue("uk");
  await page.getByLabel("Business name").fill("Harper Studio");
  const setUp = page.getByRole("button", { name: "Set up my books" });
  await continueUntil(page, setUp);
  await setUp.click();
  await page.waitForURL(/\/app$/);

  // A client abroad, who pays in dollars.
  await openNew(page, /Add a customer/);
  const form = page.locator("#new");
  await form.getByLabel("Customer name").fill("Brightline Inc");
  await form.getByLabel("Email for invoices").fill("ap@brightline.example");
  await form.getByLabel("Usual currency").selectOption("USD");
  await form.getByRole("button", { name: "Add customer", exact: true }).click();
  await expect(page.getByText("Customer added")).toBeVisible();

  // Their invoice starts in dollars; with no rate found, the owner types it.
  await openNew(page, /Send a/);
  await page.getByRole("combobox", { name: "Customer", exact: true }).selectOption({ label: "Brightline Inc" });
  await expect(page.getByRole("combobox", { name: "Currency" })).toHaveValue("USD");
  await expect(page.getByText("We couldn't find a rate for this day")).toBeVisible();
  await page.getByLabel("GBP for 1 USD").fill("0.79");
  await page.getByLabel("Line 1", { exact: true }).fill("Product design sprint");
  await page.locator("li").filter({ has: page.getByLabel("Line 1", { exact: true }) }).getByLabel(/^Price/).fill("1000");
  await expect(page.getByTestId("home-total")).toContainText("£790.00 in your books");
  await expect(page.getByTestId("preview-home")).toContainText("Total in GBP");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/fx-editor.png`, fullPage: true });
  await page.getByRole("button", { name: /Save and send/ }).click();
  await expect(page.getByTestId("amount-due")).toHaveText("US$1,000.00");
  await expect(page.getByTestId("amount-home")).toContainText("£790.00 in your books");

  // $1,000 arrives as £800: the £10 difference is an exchange rate gain.
  const pay = page.locator("#pay");
  await pay.getByLabel(/What reached your bank/).fill("800");
  await pay.getByLabel("How they paid").selectOption("Bank transfer");
  await pay.getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByText("Paid in full").first()).toBeVisible();
  await expect(page.locator("main")).toContainText("£800.00 in the bank (exchange gain £10.00)");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/fx-invoice.png`, fullPage: true });

  // Coming in counts pounds: what reached the bank.
  await page.goto("/app?period=month");
  await expect(page.locator("main")).toContainText("£800");

  expect(errors).toEqual([]);
});
