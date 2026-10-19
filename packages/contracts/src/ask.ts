import { z } from "zod";
import { endpoint } from "./endpoint";

export const AskSource = z.object({
  n: z.number().int(),
  title: z.string(),
  url: z.string().optional(),
  kind: z.enum(["books", "official"]),
});
export type AskSource = z.infer<typeof AskSource>;

export const AskMessage = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  sources: z.array(AskSource),
  model: z.string().nullable(),
  createdAt: z.string(),
});
export type AskMessage = z.infer<typeof AskMessage>;

export const AskThread = z.object({ id: z.string(), title: z.string(), lastAt: z.string(), messages: z.number().int() });
export type AskThread = z.infer<typeof AskThread>;

export const ask = {
  /** Answers a question with Gemini on Vertex AI. 503 ask_not_set_up when Vertex AI isn't configured. */
  ask: endpoint({
    method: "POST", path: "/ask",
    body: z.object({
      question: z.string().trim().min(3, "Type a question first").max(2000, "Keep it under 2,000 characters"),
      threadId: z.string().uuid().optional().nullable(),
    }),
    response: z.object({ threadId: z.string(), answer: z.string(), sources: z.array(AskSource), model: z.string() }),
  }),
  threads: endpoint({ method: "GET", path: "/ask/threads", response: z.object({ threads: z.array(AskThread), setUp: z.boolean() }) }),
  thread: endpoint({ method: "GET", path: "/ask/threads/:id", response: z.object({ id: z.string(), messages: z.array(AskMessage) }) }),
};
