import type { Config } from "../config";
import { createEmail, type EmailService, type EmailTransport } from "./email";
import { diskStorage, type Storage } from "./storage";

export type Services = { email: EmailService; storage: Storage };

export function createServices(config: Config, overrides: { transport?: EmailTransport | null; storage?: Storage } = {}): Services {
  return {
    email: createEmail(config, { transport: overrides.transport }),
    storage: overrides.storage ?? diskStorage(config.storage.dir),
  };
}
