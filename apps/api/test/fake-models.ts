import { BaseLlm, LogLevel, setLogLevel, type LlmRequest, type LlmResponse } from "@google/adk";
import type { Config } from "../src/config";
import { priced, type Models } from "../src/agents/platform/models";

setLogLevel(LogLevel.ERROR);

/** What the fake saw on each call: the conversation, instruction and tools, as Gemini gets them. */
export type SeenRequest = { contents: NonNullable<LlmRequest["contents"]>; system: string; tools: { name: string; parametersJsonSchema?: unknown }[] };

/** A scripted Gemini: returns the responses in order and records every request. */
export class FakeLlm extends BaseLlm {
  script: (LlmResponse | Error)[] = [];
  seen: SeenRequest[] = [];
  constructor(model = "gemini-test") {
    super({ model });
  }
  async *generateContentAsync(req: LlmRequest): AsyncGenerator<LlmResponse, void> {
    const sys = req.config?.systemInstruction;
    this.seen.push(structuredClone({
      contents: req.contents,
      system: typeof sys === "string" ? sys : JSON.stringify(sys ?? ""),
      tools: (req.config?.tools ?? []).flatMap((t) => ("functionDeclarations" in t ? t.functionDeclarations ?? [] : [])).map((d) => ({ name: d.name!, parametersJsonSchema: d.parametersJsonSchema })),
    }));
    const next = this.script.shift();
    if (!next) throw new Error("No scripted response left");
    if (next instanceof Error) throw next;
    yield { modelVersion: this.model, ...next };
  }
  async connect(): Promise<never> {
    throw new Error("No live connections in tests");
  }
}

export function fakeModels(config: Config, llm = new FakeLlm()): Models & { llm: FakeLlm } {
  return { ...priced(config, () => llm), llm };
}

const usage = (i: number, o: number) => ({ promptTokenCount: i, candidatesTokenCount: o, totalTokenCount: i + o });

/** The model asks for tools. */
export const calls = (list: { name: string; args: Record<string, unknown> }[], tokens: [number, number] = [1000, 50]): LlmResponse => ({
  content: { role: "model", parts: list.map((c, i) => ({ functionCall: { id: `call_${i}_${c.name}`, name: c.name, args: c.args } })) },
  usageMetadata: usage(...tokens),
});

/** The model answers. */
export const text = (s: string, tokens: [number, number] = [1200, 80]): LlmResponse => ({
  content: { role: "model", parts: [{ text: s }] },
  finishReason: "STOP" as LlmResponse["finishReason"],
  usageMetadata: usage(...tokens),
});

/** The model declines for safety reasons. */
export const blocked = (): LlmResponse => ({ errorCode: "SAFETY", finishReason: "SAFETY" as LlmResponse["finishReason"], usageMetadata: usage(300, 0) });
