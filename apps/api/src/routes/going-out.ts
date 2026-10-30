import type { FastifyInstance } from "fastify";
import { attachmentRoutes } from "./going-out/attachments";
import { billRoutes } from "./going-out/bills";
import { expenseRoutes } from "./going-out/expenses";
import { monthlyRoutes } from "./going-out/monthly";
import { categoriesFor, hasProperty } from "./going-out/shared";
import { summaryRoutes } from "./going-out/summary";
import { supplierRoutes } from "./going-out/suppliers";
import { goingOut } from "@billingease/contracts";
import { rulesFor, today } from "@billingease/core";
import { route } from "../lib/route";

/**
 * Going out: suppliers, expenses, bills, every-month costs and attachments. Registered in its
 * own plugin so multipart uploads are only accepted here.
 */
export async function goingOutRoutes(app: FastifyInstance) {
  await app.register(async (out) => {
    route(out, goingOut.setup, ({ ctx }) => {
      const b = ctx.business;
      const rules = rulesFor(b.country);
      return {
        country: b.country,
        currency: b.currency,
        categories: categoriesFor(b).map((c) => ({ id: c.id, name: c.name, official: c.official, allowable: c.allowable, scope: c.scope, capital: c.id === "capital" })),
        payMethods: rules.payMethods,
        vatRegistered: b.vatRegistered,
        hasProperty: hasProperty(b),
        businessUse: b.country === "uk",
        categorySource: { uk: "HMRC self-employment categories", lk: "Lines from the business income schedule", us: "IRS Schedule C lines" }[b.country],
        vatRates: rules.vatRates,
        defaultVatBps: rules.vatRates.find((r) => r.id === rules.defaultVatRateId)?.bps ?? 0,
        today: today(),
      };
    });
    await supplierRoutes(out);
    await expenseRoutes(out);
    await billRoutes(out);
    await monthlyRoutes(out);
    await summaryRoutes(out);
    await attachmentRoutes(out);
  });
}
