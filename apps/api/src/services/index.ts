import { vertexModels, type Models } from "../agents/platform/models";
import type { Config } from "../config";
import { createEmail, type EmailService, type EmailTransport } from "./email";
import { fetchClientDocument, type FetchClientDocument } from "./client-document";
import { diskStorage, s3Storage, type Storage } from "./storage";
import { createFx, type FxService, type RateSource } from "./fx";
import { googleSignIn, type GoogleSignIn } from "./google";

/**
 * `models` is null when Vertex AI isn't configured: Ask and the agents then say they aren't set up.
 * `clientDocument` reads an OAuth app's metadata document from its URL.
 * `google` is null when Google sign-in isn't configured.
 */
export type Services = { email: EmailService; storage: Storage; models: Models | null; clientDocument: FetchClientDocument; fx: FxService; google: GoogleSignIn | null };

export function createServices(config: Config, overrides: { transport?: EmailTransport | null; storage?: Storage; models?: Models | null; clientDocument?: FetchClientDocument; rates?: RateSource | null; google?: GoogleSignIn | null } = {}): Services {
  return {
    email: createEmail(config, { transport: overrides.transport }),
    storage: overrides.storage ?? (config.storage.s3 ? s3Storage(config.storage.s3) : diskStorage(config.storage.dir)),
    models: overrides.models !== undefined ? overrides.models : vertexModels(config),
    clientDocument: overrides.clientDocument ?? fetchClientDocument,
    google: overrides.google !== undefined ? overrides.google : googleSignIn(config),
    fx: overrides.rates !== undefined ? createFx(config, overrides.rates, "test") : createFx(config),
  };
}
