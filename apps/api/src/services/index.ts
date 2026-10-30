import { vertexModels, type Models } from "../agents/platform/models";
import type { Config } from "../config";
import { createEmail, type EmailService, type EmailTransport } from "./email";
import { diskStorage, type Storage } from "./storage";

/** `models` is null when Vertex AI isn't configured: Ask and the agents then say they aren't set up. */
export type Services = { email: EmailService; storage: Storage; models: Models | null };

export function createServices(config: Config, overrides: { transport?: EmailTransport | null; storage?: Storage; models?: Models | null } = {}): Services {
  return {
    email: createEmail(config, { transport: overrides.transport }),
    storage: overrides.storage ?? diskStorage(config.storage.dir),
    models: overrides.models !== undefined ? overrides.models : vertexModels(config),
  };
}
