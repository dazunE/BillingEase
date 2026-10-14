import type { Config } from "../config";
import { claudeAskClient, type AskClient } from "./ask-client";
import { createEmail, type EmailService, type EmailTransport } from "./email";
import { diskStorage, type Storage } from "./storage";

/** Ask is null when there's no Claude API key: POST /ask then answers "ask_not_set_up". */
export type Services = { email: EmailService; storage: Storage; ask: AskClient | null };

export function createServices(config: Config, overrides: { transport?: EmailTransport | null; storage?: Storage; ask?: AskClient | null } = {}): Services {
  return {
    email: createEmail(config, { transport: overrides.transport }),
    storage: overrides.storage ?? diskStorage(config.storage.dir),
    ask: overrides.ask !== undefined ? overrides.ask : claudeAskClient(config),
  };
}
