/**
 * Integration points for regulated services. Each has a sandbox implementation
 * that runs locally with fake data. Swap in a real provider (Stripe Connect,
 * Plaid, a payroll API) by implementing the same interface and selecting it
 * from environment variables here.
 */
import { addDays } from "../dates";

// ---------------------------------------------------------------------------
// Online payments (e.g. Stripe Connect)

export type ChargeResult = { ok: true; reference: string; feeCents: number } | { ok: false; message: string };

export interface PaymentsProvider {
  readonly name: string;
  charge(input: { amountCents: number; method: "card" | "bank"; cardNumber?: string; description: string }): Promise<ChargeResult>;
}

/** Sandbox: card 4242 4242 4242 4242 succeeds, 4000 0000 0000 0002 is declined. */
export const sandboxPayments: PaymentsProvider = {
  name: "sandbox",
  async charge({ amountCents, method, cardNumber }) {
    const digits = (cardNumber ?? "").replace(/\D/g, "");
    if (method === "card" && digits.endsWith("0002")) return { ok: false, message: "Your card was declined." };
    if (method === "card" && digits.length < 12) return { ok: false, message: "Enter a full card number." };
    const feeCents = method === "card" ? Math.round(amountCents * 0.029) + 30 : Math.max(100, Math.round(amountCents * 0.01));
    return { ok: true, reference: "sbx_" + Math.random().toString(36).slice(2, 12), feeCents };
  },
};

export function paymentsProvider(): PaymentsProvider {
  return sandboxPayments;
}

// ---------------------------------------------------------------------------
// Bank and card feeds (e.g. Plaid)

export type FeedTransaction = { externalId: string; postedOn: string; description: string; amountCents: number };
export type FeedAccount = { institution: string; mask: string; kind: "checking" | "card"; transactions: FeedTransaction[] };

export interface BankProvider {
  readonly name: string;
  /** Returns the accounts the user connected, with recent transactions. */
  connect(today: string): Promise<FeedAccount[]>;
}

/** Sandbox: a checking account and a business card with a month of realistic activity. */
export const sandboxBank: BankProvider = {
  name: "sandbox",
  async connect(today) {
    const d = (n: number) => addDays(today, -n);
    return [
      {
        institution: "Chase Business Checking",
        mask: "4417",
        kind: "checking",
        transactions: [
          { externalId: "chk-1", postedOn: d(26), description: "WEWORK RENT", amountCents: -120000 },
          { externalId: "chk-2", postedOn: d(21), description: "COMCAST BUSINESS", amountCents: -12900 },
          { externalId: "chk-3", postedOn: d(14), description: "GUSTO CONTRACTOR PAYMENT", amountCents: -93600 },
          { externalId: "chk-4", postedOn: d(3), description: "WEWORK RENT", amountCents: -120000 },
          { externalId: "chk-5", postedOn: d(2), description: "MOBILE DEPOSIT REF 1029", amountCents: 54000 },
          { externalId: "chk-6", postedOn: d(1), description: "INTEREST PAYMENT", amountCents: 312 },
        ],
      },
      {
        institution: "Amex Business",
        mask: "1009",
        kind: "card",
        transactions: [
          { externalId: "amx-1", postedOn: d(24), description: "ADOBE CREATIVE CLOUD", amountCents: -8999 },
          { externalId: "amx-2", postedOn: d(20), description: "FIGMA MONTHLY", amountCents: -4500 },
          { externalId: "amx-3", postedOn: d(12), description: "DELTA AIR LINES", amountCents: -41230 },
          { externalId: "amx-4", postedOn: d(9), description: "STAPLES 01142", amountCents: -8419 },
          { externalId: "amx-5", postedOn: d(6), description: "SHELL OIL 57412", amountCents: -4820 },
          { externalId: "amx-6", postedOn: d(4), description: "SQ *BLUE BOTTLE COFFEE", amountCents: -1850 },
          { externalId: "amx-7", postedOn: d(3), description: "AMZN MKTP US", amountCents: -6420 },
          { externalId: "amx-8", postedOn: d(2), description: "UBER *TRIP", amountCents: -2780 },
          { externalId: "amx-9", postedOn: d(1), description: "CANVA PRO", amountCents: -1499 },
        ],
      },
    ];
  },
};

export function bankProvider(): BankProvider {
  return sandboxBank;
}

// ---------------------------------------------------------------------------
// Payroll (e.g. Gusto Embedded or Check)

export interface PayrollProvider {
  readonly name: string;
  /** Submits an approved run. Real providers move the money and file taxes. */
  submit(run: { payDate: string; totalCents: number }): Promise<{ reference: string }>;
}

export const sandboxPayroll: PayrollProvider = {
  name: "sandbox",
  async submit() {
    return { reference: "sbx_pr_" + Math.random().toString(36).slice(2, 10) };
  },
};

export function payrollProvider(): PayrollProvider {
  return sandboxPayroll;
}
