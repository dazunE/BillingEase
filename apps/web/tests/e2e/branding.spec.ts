import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

/** The owner gives their invoices a logo, a layout, a colour, a typeface and a footer line. */

async function continueUntil(page: Page, target: Locator) {
  for (let i = 0; i < 6 && !(await target.isVisible()); i++) await page.getByRole("button", { name: "Continue" }).click();
  await expect(target).toBeVisible();
}

const SHOTS = process.env.E2E_SHOTS_DIR;

test("UK: branding invoices with a logo, the Modern layout and a footer", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/sign-up");
  await page.getByLabel("Where is your business based?").selectOption("uk");
  await page.getByLabel("Your name").fill("Nora Starling");
  await page.getByLabel("Email").fill(`brand-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/setup/);
  await page.getByLabel("Business name").fill("Nordstar Design");
  const setUp = page.getByRole("button", { name: "Set up my books" });
  await continueUntil(page, setUp);
  await setUp.click();
  await page.waitForURL(/\/app$/);

  // From the account menu.
  await page.goto("/app/settings/branding");
  await expect(page.getByRole("heading", { name: "Invoice branding" })).toBeVisible();

  // A logo that isn't a PNG or JPEG is turned away in the browser.
  await page.getByLabel("Logo image").setInputFiles({ name: "logo.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") });
  await expect(page.getByText("Use a PNG or JPEG")).toBeVisible();
  await page.getByLabel("Logo image").setInputFiles(path.join(__dirname, "logo.png"));
  await expect(page.getByText("Logo saved.")).toBeVisible();
  await expect(page.getByTestId("logo-img")).toBeVisible();

  await page.locator("label", { hasText: "Modern" }).click();
  await page.getByLabel("Teal").check({ force: true });
  await page.locator("label", { hasText: "JetBrains Mono" }).click();
  await page.getByLabel("Footer line").fill("Nordstar Design Ltd · Registered in England 01234567");
  const preview = page.getByLabel("VAT invoice preview").or(page.getByLabel("Invoice preview"));
  await expect(page.getByTestId("preview-band")).toHaveCSS("background-color", "rgb(15, 118, 110)");
  await expect(page.getByTestId("preview-footer")).toContainText("Registered in England");
  await expect(preview.getByRole("img", { name: /logo/ })).toBeVisible();
  await page.getByRole("button", { name: "Save branding" }).click();
  await expect(page.getByText("Saved. Your invoices")).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/branding-settings.png`, fullPage: true });

  // It stays after a reload, and a new invoice's preview uses it.
  await page.reload();
  await expect(page.getByLabel("Colour as a hex code")).toHaveValue("#0F766E");
  await page.goto("/app/in/invoices/new");
  await expect(page.getByTestId("preview-band")).toBeVisible();
  await expect(page.locator("article[data-template=modern]").getByRole("img", { name: /logo/ })).toBeVisible();

  expect(errors).toEqual([]);
});
