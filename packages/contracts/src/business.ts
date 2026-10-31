import { z } from "zod";
import { Country, endpoint, optionalText } from "./endpoint";

const Kind = z.enum(["sole_trader", "landlord", "both", "sole_proprietor", "partnership"]);

/** Business types each country offers. In the US, a single-member LLC is taxed as a sole proprietor and a multi-member LLC as a partnership. */
export const KINDS_BY_COUNTRY: Record<z.infer<typeof Country>, z.infer<typeof Kind>[]> = {
  uk: ["sole_trader", "landlord", "both"],
  lk: ["sole_proprietor", "partnership"],
  us: ["sole_proprietor", "partnership"],
};

/** Invoice, quote and credit note layouts. */
export const TEMPLATES = ["classic", "modern", "minimal"] as const;
export const Template = z.enum(TEMPLATES);
/** Typefaces for customer documents: DM Sans, Source Serif 4 or JetBrains Mono. */
export const FONTS = ["sans", "serif", "mono"] as const;
export const Font = z.enum(FONTS);
/** The largest logo accepted, in bytes. */
export const LOGO_MAX_BYTES = 1024 * 1024;

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
  /** How customer documents look: layout, typeface and a line at the foot of every page. */
  template: Template,
  font: Font,
  footer: z.string().nullable(),
  /** Whether a logo is uploaded, and a version that changes with it (for caching its image). */
  hasLogo: z.boolean(),
  logoVersion: z.string().nullable(),
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
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a colour like #7A5AF8"),
  template: Template,
  font: Font,
  footer: optionalText(200),
  settings: z.record(z.string(), z.unknown()).default({}),
}).partial();

export const business = {
  create: endpoint({ method: "POST", path: "/businesses", auth: "user", body: CreateBusinessBody, response: Business }),
  get: endpoint({ method: "GET", path: "/business", response: Business }),
  update: endpoint({ method: "PATCH", path: "/business", roles: ["owner"], body: UpdateBusinessBody, response: Business }),
  /** A PNG or JPEG logo, base64 encoded, up to 1 MB. It goes on invoices, quotes, credit notes and their emails. */
  uploadLogo: endpoint({
    method: "PUT", path: "/business/logo", roles: ["owner"],
    body: z.object({ image: z.string().min(1, "Choose an image").max(Math.ceil((LOGO_MAX_BYTES * 4) / 3) + 8, "That image is over 1 MB") }),
    response: Business,
  }),
  removeLogo: endpoint({ method: "DELETE", path: "/business/logo", roles: ["owner"], response: Business }),
  /** Raw image bytes. */
  logo: endpoint({ method: "GET", path: "/business/logo", response: z.unknown() }),
};
