import { forwarded } from "@/lib/forward";

// /.well-known/* is rewritten here (next.config): OAuth metadata for apps and MCP clients.
export const { GET, OPTIONS } = forwarded((_req, p) => `/.well-known/${(p.path as string[]).map(encodeURIComponent).join("/")}`);
