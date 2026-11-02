import { expect, test } from "@playwright/test";

/**
 * Help and Everything BillingEase does, in the app and in the business's country, and Home on a
 * phone: one row per number, nothing hidden under the bottom island.
 */

const API = "http://127.0.0.1:4200";
const WEB = "http://127.0.0.1:3200";

async function owner(request: import("@playwright/test").APIRequestContext, country: "uk" | "lk") {
  const s = await (await request.post(`${API}/auth/sign-up`, { data: { name: country === "uk" ? "Ellie Harper" : "Ayesha Fernando", email: `help-${country}-${Date.now()}@example.com`, password: "correct horse battery" } })).json();
  const body = country === "uk"
    ? { country, kind: "both", name: "Harper Studio", ownerName: "Ellie Harper", vatRegistered: false }
    : { country, kind: "sole_proprietor", name: "Serendib Design Studio", ownerName: "Ayesha Fernando", taxId: "104563218", vatRegistered: false };
  await request.post(`${API}/businesses`, { headers: { authorization: `Bearer ${s.token}` }, data: body });
  return s.token as string;
}

test("UK: Help and Everything from the account menu, with UK-only features", async ({ page, request, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.addCookies([{ name: "be_session", value: await owner(request, "uk"), url: WEB }]);

  await page.goto("/app");
  // The menu can be clicked before the page is ready; try until it's open.
  const help = page.getByRole("menuitem", { name: /^Help/ });
  await expect(async () => {
    if (!(await help.isVisible())) await page.locator("summary[aria-label^=\"Your business:\"]").click();
    await expect(help).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 30_000 });
  await help.click();
  await expect(page).toHaveURL(/\/app\/help$/);
  await expect(page.getByRole("heading", { name: "How can we help, Ellie?" })).toBeVisible();
  // The bottom island stays on Home's sections.
  await expect(page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");

  await page.getByRole("searchbox", { name: "Search help" }).fill("mileage");
  await expect(page.getByRole("heading", { name: /answers? for “mileage”/ })).toBeVisible();
  await expect(page.getByText("45p a mile for the first 10,000 miles")).toBeVisible();
  await page.getByRole("link", { name: "Log a trip" }).click();
  await expect(page).toHaveURL(/\/app\/out\/mileage#log$/);

  await page.goto("/app/help");
  await page.getByRole("searchbox", { name: "Search help" }).fill("payroll quantum");
  await expect(page.getByText("No answer for “payroll quantum” yet")).toBeVisible();
  // Talk to a person writes an email: nothing is sent until the fields are right.
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText("Tell us a little more (at least a sentence).")).toBeVisible();
  await expect(page.getByRole("link", { name: "help@billingease.app" })).toHaveAttribute("href", "mailto:help@billingease.app");

  await page.getByRole("link", { name: "Everything BillingEase does" }).last().click();
  await expect(page).toHaveURL(/\/app\/everything$/);
  await expect(page.getByRole("heading", { name: "Everything BillingEase does" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Quarters/ })).toHaveAttribute("href", "/app/keep/quarters");
  await expect(page.getByRole("link", { name: /^Mileage/ })).toHaveAttribute("href", "/app/out/mileage");
  await expect(page.getByRole("link", { name: /^Your rental property/ })).toHaveAttribute("href", "/app/out/properties");
  await expect(page.getByText("EPF · ETF · APIT")).toHaveCount(0);
  await page.getByRole("button", { name: "Landlords" }).click();
  await expect(page.getByText("For landlords").first()).toBeVisible();
  await page.getByRole("searchbox", { name: "Search features" }).fill("mortgage");
  await expect(page.getByText(/1 of \d+ features match “mortgage”/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("Sri Lanka: Everything lists VAT, SSCL and payroll, not UK features", async ({ page, request, context }) => {
  await context.addCookies([{ name: "be_session", value: await owner(request, "lk"), url: WEB }]);
  await page.goto("/app/everything");
  await expect(page.getByRole("link", { name: /^VAT and SSCL periods/ })).toBeVisible();
  await expect(page.getByText("EPF · ETF · APIT")).toBeVisible();
  await expect(page.getByText("No employees yet ·")).toBeVisible();
  await expect(page.getByRole("link", { name: /^Mileage/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^Quarters/ })).toHaveCount(0);
  await page.goto("/app/help");
  await page.getByRole("searchbox", { name: "Search help" }).fill("cheque");
  await expect(page.getByText(/bank transfer, cheque, cash or LankaQR/)).toBeVisible();
});

test("Home on a phone: the stacked equation and nothing under the island", async ({ page, request, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.addCookies([{ name: "be_session", value: await owner(request, "uk"), url: WEB }]);
  await page.goto("/app");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome, Ellie");
  // No sideways scrolling.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  // The period switch spans the width; the three numbers are one per row.
  const period = await page.getByRole("navigation", { name: "Period" }).boundingBox();
  expect(period!.width).toBeGreaterThan(340);
  const inBox = (await page.getByTestId("coming-in").boundingBox())!;
  const outBox = (await page.getByTestId("going-out").boundingBox())!;
  expect(outBox.y).toBeGreaterThan(inBox.y + 40);
  await expect(page.getByRole("link", { name: "Open quarters" })).toBeVisible();
  // The last thing on the page clears the bottom island once scrolled to the end.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const island = (await page.getByRole("navigation", { name: "Sections" }).boundingBox())!;
  const more = (await page.getByRole("navigation", { name: "More places" }).boundingBox())!;
  expect(more.y + more.height).toBeLessThanOrEqual(island.y);
  await page.getByRole("navigation", { name: "More places" }).getByRole("link", { name: "Help" }).click();
  await expect(page).toHaveURL(/\/app\/help$/);
});
