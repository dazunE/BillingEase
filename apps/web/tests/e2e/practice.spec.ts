import { expect, test } from "@playwright/test";

/**
 * UK property, mileage and your accountant: add a flat and its rent, log a trip at 45p a mile,
 * and send your accountant a message; then see their view.
 */

const API = "http://127.0.0.1:4200";
const WEB = "http://127.0.0.1:3200";

test("UK: a property's rent, a trip, and a message to your accountant", async ({ page, request, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const s = await (await request.post(`${API}/auth/sign-up`, { data: { name: "Ellie Harper", email: `practice-${Date.now()}@example.com`, password: "correct horse battery" } })).json();
  await request.post(`${API}/businesses`, { headers: { authorization: `Bearer ${s.token}` }, data: { country: "uk", kind: "both", name: "Harper Studio", ownerName: "Ellie Harper", vatRegistered: false } });
  await context.addCookies([{ name: "be_session", value: s.token, url: WEB }]);

  // Properties: add the flat, then September's rent and the agent's fee.
  await page.goto("/app/out/properties");
  await page.getByLabel(/^Name/).fill("Flat 2, 18 Ash Grove");
  await page.getByLabel("Rent a month (£)").fill("1050");
  await page.getByRole("button", { name: "Add the property" }).click();
  await expect(page.getByRole("region", { name: "Flat 2, 18 Ash Grove" })).toBeVisible();
  const add = page.getByRole("region", { name: "Add a cost or income" });
  await add.getByLabel("Date").fill("2026-09-07");
  await add.getByLabel("What for").fill("Rent for September");
  await add.getByLabel(/^Amount/).fill("1050");
  await add.getByRole("button", { name: "Record rent" }).click();
  await expect(add.getByRole("status")).toHaveText("Rent recorded.");
  await add.getByText("A cost", { exact: true }).click();
  await add.getByLabel("Date").fill("2026-09-01");
  await add.getByLabel("What for").fill("Mortgage interest");
  await add.getByLabel("Category").selectOption({ label: "Mortgage interest" });
  await add.getByLabel(/^Amount/).fill("410");
  await add.getByRole("button", { name: "Record the cost" }).click();
  await expect(add.getByRole("status")).toHaveText("Cost recorded.");
  await expect(page.getByText("£82 off your tax")).toBeVisible();

  // Mileage: Leeds to York and back, 25 miles each way.
  await page.goto("/app/out/mileage");
  await page.getByLabel("From").fill("Leeds");
  await page.getByLabel("To", { exact: true }).fill("York");
  await page.getByLabel(/^Miles/).fill("25");
  await page.getByRole("button", { name: "Log the trip" }).click();
  await expect(page.getByText("Leeds to York and back")).toBeVisible();
  await expect(page.getByText("£22.50").first()).toBeVisible();

  // Your accountant: none linked yet; a message; their view.
  await page.goto("/app/accountant");
  await expect(page.getByText("No accountant linked yet")).toBeVisible();
  await page.getByRole("navigation", { name: "Accountant pages" }).getByRole("link", { name: "What they see" }).click();
  await expect(page.getByRole("heading", { name: "What your accountant sees" })).toBeVisible();
  await expect(page.getByText("Rent from property")).toBeVisible();
  expect(errors).toEqual([]);
});
