import { z } from "zod";
import { endpoint, IsoDate, Minor, Ok, optionalText } from "./endpoint";

/** UK property and mileage, and working with your accountant (requests and messages). */

// ---- Property (UK) -----------------------------------------------------------------------

export const Property = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  sharePct: z.number().int(),
  monthlyRent: Minor,
  rentDay: z.number().int().nullable(),
  agent: z.string().nullable(),
  archived: z.boolean(),
});
export type Property = z.infer<typeof Property>;

export const PropertyBody = z.object({
  name: z.string().trim().min(1, "Name the property, like Flat 2, 18 Ash Grove").max(120),
  address: optionalText(200),
  sharePct: z.number().int().min(1, "At least 1%").max(100, "At most 100%").default(100),
  monthlyRent: Minor.min(0).default(0),
  rentDay: z.number().int().min(1).max(31).optional().nullable(),
  agent: optionalText(120),
});

export const PropertyEntry = z.object({
  id: z.string(),
  propertyId: z.string(),
  kind: z.enum(["rent", "cost"]),
  on: IsoDate,
  description: z.string(),
  payee: z.string().nullable(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  categoryOfficial: z.string().nullable(),
  amount: Minor,
  /** The owner's share: what's in the books. */
  share: Minor,
  method: z.string(),
});
export type PropertyEntry = z.infer<typeof PropertyEntry>;

export const PropertyEntryBody = z.object({
  kind: z.enum(["rent", "cost"]),
  on: IsoDate,
  description: z.string().trim().min(1, "Say what it was").max(200),
  payee: optionalText(120),
  categoryId: z.string().trim().max(40).optional().nullable(),
  amount: Minor.positive("Enter an amount more than 0"),
  method: z.string().trim().min(1).max(40).default("Bank transfer"),
});

const PropertyTotals = z.object({ rent: Minor, costs: Minor, finance: Minor, profit: Minor });

export const properties = {
  list: endpoint({
    method: "GET", path: "/properties", query: z.object({ date: IsoDate.optional() }),
    response: z.object({
      taxYear: z.object({ label: z.string(), from: IsoDate, to: IsoDate }),
      properties: z.array(Property.extend({ totals: PropertyTotals, rentMonths: z.array(z.object({ month: z.string(), received: Minor })) })),
      totals: PropertyTotals,
      /** The £1,000 property allowance: whether it beats the costs so far. */
      allowance: Minor,
      quarters: z.array(z.object({ id: z.string(), label: z.string(), from: IsoDate, to: IsoDate, rent: Minor, costs: Minor, finance: Minor })),
      entries: z.array(PropertyEntry),
      categories: z.array(z.object({ id: z.string(), name: z.string(), official: z.string() })),
    }),
  }),
  create: endpoint({ method: "POST", path: "/properties", body: PropertyBody, response: Property }),
  update: endpoint({ method: "PATCH", path: "/properties/:id", body: PropertyBody, response: Property }),
  addEntry: endpoint({ method: "POST", path: "/properties/:id/entries", body: PropertyEntryBody, response: PropertyEntry }),
  /** Takes an entry back out of the books (a reversal is posted). */
  removeEntry: endpoint({ method: "DELETE", path: "/properties/entries/:entryId", response: Ok }),
};

// ---- Mileage (UK) ------------------------------------------------------------------------

export const Trip = z.object({
  id: z.string(),
  on: IsoDate,
  from: z.string(),
  to: z.string(),
  purpose: z.string().nullable(),
  /** Tenths of a mile. */
  miles: z.number().int(),
  vehicle: z.enum(["car", "motorcycle", "bicycle"]),
  amount: Minor,
  /** In a period that's been sent: it can't be removed. */
  locked: z.boolean(),
});
export type Trip = z.infer<typeof Trip>;

export const TripBody = z.object({
  on: IsoDate,
  from: z.string().trim().min(1, "Where from?").max(120),
  to: z.string().trim().min(1, "Where to?").max(120),
  purpose: optionalText(200),
  miles: z.number().int().positive("Enter the miles").max(100_000),
  vehicle: z.enum(["car", "motorcycle", "bicycle"]).default("car"),
  /** Count the trip there and back. */
  returnTrip: z.boolean().default(false),
});

export const mileage = {
  list: endpoint({
    method: "GET", path: "/mileage", query: z.object({ date: IsoDate.optional() }),
    response: z.object({
      taxYear: z.object({ label: z.string(), from: IsoDate, to: IsoDate }),
      trips: z.array(Trip),
      totals: z.object({ miles: z.number().int(), amount: Minor, trips: z.number().int(), carMiles: z.number().int() }),
      quarters: z.array(z.object({ id: z.string(), label: z.string(), from: IsoDate, to: IsoDate, miles: z.number().int(), amount: Minor, trips: z.number().int() })),
      verified: z.boolean(),
    }),
  }),
  add: endpoint({ method: "POST", path: "/mileage", body: TripBody, response: Trip }),
  remove: endpoint({ method: "DELETE", path: "/mileage/:id", response: Ok }),
};

// ---- Your accountant ---------------------------------------------------------------------

export const PracticeRequest = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  link: z.string().nullable(),
  status: z.enum(["open", "done"]),
  from: z.string().nullable(),
  createdAt: z.string(),
  doneAt: z.string().nullable(),
});
export type PracticeRequest = z.infer<typeof PracticeRequest>;

export const PracticeMessage = z.object({ id: z.string(), from: z.string().nullable(), mine: z.boolean(), role: z.string().nullable(), body: z.string(), createdAt: z.string() });

export const practice = {
  overview: endpoint({
    method: "GET", path: "/practice",
    response: z.object({
      accountants: z.array(z.object({ userId: z.string(), name: z.string(), email: z.string(), since: z.string(), lastSeenAt: z.string().nullable() })),
      invited: z.array(z.object({ email: z.string(), expiresAt: z.string() })),
      requests: z.array(PracticeRequest),
      messages: z.array(PracticeMessage),
    }),
  }),
  /** Ask the owner for something (usually the accountant does). */
  createRequest: endpoint({
    method: "POST", path: "/practice/requests",
    body: z.object({ title: z.string().trim().min(1, "Say what you need").max(160), body: optionalText(1000), link: z.string().trim().max(200).regex(/^\/app(\/|$)/, "A link inside the app").optional().nullable() }),
    response: PracticeRequest,
  }),
  setRequest: endpoint({ method: "POST", path: "/practice/requests/:id", body: z.object({ status: z.enum(["open", "done"]) }), response: PracticeRequest }),
  sendMessage: endpoint({ method: "POST", path: "/practice/messages", body: z.object({ body: z.string().trim().min(1, "Write a message").max(2000) }), response: PracticeMessage }),
};
