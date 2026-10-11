import Anthropic from "@anthropic-ai/sdk";
import type { BetaMessage, MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { Config } from "../config";

export type AskRequest = MessageCreateParamsNonStreaming;
export type AskResponse = BetaMessage;

/**
 * The one call Ask makes to a model. The real one is the Claude API; tests pass a fake that
 * returns scripted responses, so the test suite never calls the network.
 */
export interface AskClient {
  model: string;
  create(params: AskRequest): Promise<AskResponse>;
}

export function claudeAskClient(config: Config): AskClient | null {
  if (!config.ask.apiKey) return null;
  const client = new Anthropic({ apiKey: config.ask.apiKey });
  return {
    model: config.ask.model,
    create: (params) => client.beta.messages.create(params),
  };
}
