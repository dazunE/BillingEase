import { BaseLlm, Gemini } from "@google/adk";
import type { Config, ModelTier } from "../../config";

/**
 * The models agents run on. In production each tier is Gemini on Vertex AI; tests pass
 * scripted models, so the suite never calls Google.
 */
export type Models = {
  forTier(tier: ModelTier): BaseLlm;
  /** Micro-dollars for a model call, from the configured price list. */
  cost(tier: ModelTier, tokensIn: number, tokensOut: number): number;
};

export function priced(config: Config, forTier: (tier: ModelTier) => BaseLlm): Models {
  return {
    forTier,
    cost(tier, tokensIn, tokensOut) {
      const [i, o] = config.ai.prices[tier];
      return Math.round((tokensIn * i + tokensOut * o) / 1_000_000);
    },
  };
}

/** Gemini through Vertex AI, signed in with the service account (or local gcloud credentials). */
export function vertexModels(config: Config): Models | null {
  const vertex = config.ai.vertex;
  if (!vertex) return null;
  const cache = new Map<ModelTier, BaseLlm>();
  return priced(config, (tier) => {
    let m = cache.get(tier);
    if (!m) {
      m = new Gemini({ model: config.ai.models[tier], vertexai: true, project: vertex.project, location: vertex.location });
      cache.set(tier, m);
    }
    return m;
  });
}
