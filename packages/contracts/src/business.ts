import { z } from "zod";
import { Country, endpoint, optionalText } from "./endpoint";

const Kind = z.enum(["sole_trader", "landlord", "both", "sole_proprietor", "partnership"]);

/** Business types each country offers. In the US, a single-member LLC is taxed as a sole proprietor and a multi-member LLC as a partnership. */
export const KINDS_BY_COUNTRY: Record<z.infer<typeof Country>, z.infer<typeof Kind>[]> = {
  uk: ["sole_trader", "landlord", "both"],
  lk: ["sole_proprietor", "partnership"],
  us: ["sole_proprietor", "partnership"],
};

export const Business = z.object({
  id: z.string(),
  country: Country,
  currency: z.enum(["GBP", "LKR", "USD"]),
  name: z.string(),
  legalName: z.string().nullable(),
  kind: Kind,
  ownerName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  town: z.string().nullable(),
  region: z.string().nullable(),
  postcode: z.string().nullable(),
  taxId: z.string().nullable(),
  vatRegistered: z.boolean(),
  vatNumber: z.string().nullable(),
  ssclRegistered: z.boolean(),
  basis: z.enum(["cash", "accrual"]),
  quarterType: z.enum(["standard", "calendar"]),
  invoicePrefix: z.string(),
  termsDays: z.number().int(),
  invoiceNote: z.string().nullable(),
  paymentDetails: z.string().nullable(),
  accent: z.string(),
  settings: z.record(z.string(), z.unknown()),
  role: z.enum(["owner", "accountant", "admin"]),
});
export type Business = z.infer<typeof Business>;

const profileFields = {
  name: z.string().trim().min(1, "Enter the business name").max(120),
  legalName: optionalText(160),
  ownerName: z.string().trim().min(1, "Enter the owner's name").max(120),
  email: optionalText(200),
  phone: optionalText(40),
  addressLine1: optionalText(160),
  addressLine2: optionalText(160),
  town: optionalText(80),
  region: optionalText(80),
  postcode: optionalText(20),
  taxId: optionalText(40),
  vatRegistered: z.boolean(),
  vatNumber: optionalText(40),
  ssclRegistered: z.boolean().default(false),
  basis: z.enum(["cash", "accrual"]).optional(),
  quarterType: z.enum(["standard", "calendar"]).default("standard"),
};

export const CreateBusinessBody = z.object({ country: Country, kind: Kind, ...profileFields })
  .refine((b) => !b.vatRegistered || !!b.vatNumber, { path: ["vatNumber"], message: "Enter the VAT number" })
  .refine((b) => b.country === "lk" || !b.ssclRegistered, { path: ["ssclRegistered"], message: "SSCL is for Sri Lankan businesses" })
  .refine((b) => b.country !== "us" || !b.vatRegistered, { path: ["vatRegistered"], message: "Sales tax isn't set up for US businesses yet" })
  .refine((b) => KINDS_BY_COUNTRY[b.country].includes(b.kind), { path: ["kind"], message: "Pick a business type for this country" });

export const UpdateBusinessBody = z.object({
  ...profileFields,
  kind: Kind,
  invoicePrefix: z.string().trim().min(1).max(12).regex(/^[A-Za-z0-9-/]+$/, "Use letters, numbers, - or /"),
  termsDays: z.number().int().min(0).max(365),
  invoiceNote: optionalText(1000),
  paymentDetails: optionalText(1000),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  settings: z.record(z.string(), z.unknown()).default({}),
}).partial();

export const business = {
  create: endpoint({ method: "POST", path: "/businesses", auth: "user", body: CreateBusinessBody, response: Business }),
  get: endpoint({ method: "GET", path: "/business", response: Business }),
  update: endpoint({ method: "PATCH", path: "/business", roles: ["owner"], body: UpdateBusinessBody, response: Business }),
};
