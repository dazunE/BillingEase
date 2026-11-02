import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

/**
 * Security and data: turn on two-step sign-in with an authenticator app, sign in with the code,
 * see it in Recent sign-ins, then close the business, come back with a backup code and reopen.
 */

const API = "http://127.0.0.1:4200";
const WEB = "http://127.0.0.1:3200";

/** The authenticator app: RFC 6238, SHA-1, 6 digits, 30 seconds. */
function totp(secret: string, offset = 0) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0;
  const bytes: number[] = [];
  for (const ch of secret.replace(/\s/g, "")) {
    value = (value << 5) | A.indexOf(ch);
    bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offset));
  const mac = createHmac("sha1", Buffer.from(bytes)).update(counter).digest();
  const o = mac[mac.length - 1] & 15;
  return String((mac.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

test("two-step sign-in, recent sign-ins, and closing then reopening the business", async ({ page, request, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const email = `security-${Date.now()}@example.com`;
  const password = "correct horse battery";
  const s = await (await request.post(`${API}/auth/sign-up`, { data: { name: "Ellie Harper", email, password } })).json();
  await request.post(`${API}/businesses`, { headers: { authorization: `Bearer ${s.token}` }, data: { country: "uk", kind: "sole_trader", name: "Harper Studio", ownerName: "Ellie Harper", vatRegistered: false } });
  await context.addCookies([{ name: "be_session", value: s.token, url: WEB }]);

  // Turn it on: scan (we read the key), enter a code, save the backup codes.
  await page.goto("/app/settings/security");
  await expect(page.getByRole("heading", { name: "Security and data" })).toBeVisible();
  await page.getByRole("button", { name: "Turn on" }).click();
  await expect(page.getByText("Step 1 of 2 · Connect an authenticator app")).toBeVisible();
  await expect(page.getByRole("img", { name: "QR code for your authenticator app" })).toBeVisible();
  const secret = (await page.locator("code").first().textContent())!.replace(/\s/g, "");
  expect(secret).toMatch(/^[A-Z2-7]{32}$/);
  await page.getByLabel("6-digit code").fill("000000" === totp(secret) ? "111111" : "000000");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "isn't right" })).toBeVisible();
  await page.getByLabel("6-digit code").fill(totp(secret));
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.getByText("Step 2 of 2 · Save your backup codes")).toBeVisible();
  const codes = await page.getByRole("list", { name: "Backup codes" }).getByRole("listitem").allTextContents();
  expect(codes).toHaveLength(10);
  await page.getByRole("button", { name: "I saved them, finish" }).click();
  await expect(page.getByText(/On since .* · 10 backup codes left/)).toBeVisible();

  // Sign in again: the password, then the code.
  await context.clearCookies();
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/sign-in\/code$/);
  await expect(page.getByRole("heading", { name: "Enter your code." })).toBeVisible();
  await page.getByLabel("6-digit code").fill(totp(secret, 1));
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.goto("/app/settings/security");
  const recent = page.getByRole("region", { name: "Recent sign-ins" });
  await expect(recent.getByText("Password and code")).toBeVisible();
  await expect(recent.getByText("Signed up")).toBeVisible();

  // Close things down: nothing happens until the name is typed.
  const close = page.getByRole("region", { name: "Close things down" });
  await close.getByRole("button", { name: "Close my account" }).click();
  const confirm = close.getByRole("button", { name: "Close my account" });
  await expect(confirm).toBeDisabled();
  await close.getByLabel("Type Harper Studio to confirm").fill("harper studio");
  await confirm.click();
  await expect(page).toHaveURL(/\/sign-in\?closed=1$/);
  await expect(page.getByText("Your account is closed")).toBeVisible();

  // Back in with a backup code: it's read-only, and can be reopened.
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Use a backup code" }).click();
  await page.getByLabel("Backup code").fill(codes[0]);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText(/Harper Studio is closed\. Everything is deleted on/)).toBeVisible();
  await page.getByRole("button", { name: "Reopen Harper Studio" }).click();
  await expect(page.getByText(/Harper Studio is closed/)).toHaveCount(0);
  expect(errors).toEqual([]);
});
