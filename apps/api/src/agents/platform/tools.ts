import { BaseTool, type RunAsyncToolRequest } from "@google/adk";
import type { FunctionDeclaration } from "@google/genai";
import type { z } from "zod";

/**
 * A tool the model can call: a JSON Schema the model sees, and a zod schema that checks what
 * it sends before anything runs. A bad input comes back to the model as an error it can fix,
 * never as a crash.
 */
export class JsonTool<S extends z.ZodType> extends BaseTool {
  constructor(private def: { name: string; description: string; input: S; schema: Record<string, unknown>; run: (input: z.output<S>) => Promise<unknown> }) {
    super({ name: def.name, description: def.description });
  }

  override _getDeclaration(): FunctionDeclaration {
    return { name: this.name, description: this.description, parametersJsonSchema: this.def.schema };
  }

  async runAsync({ args }: RunAsyncToolRequest): Promise<unknown> {
    const parsed = this.def.input.safeParse(args ?? {});
    if (!parsed.success) {
      return { error: `Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ")}` };
    }
    try {
      return await this.def.run(parsed.data);
    } catch (err) {
      return { error: `The tool failed: ${(err as Error).message}` };
    }
  }
}
