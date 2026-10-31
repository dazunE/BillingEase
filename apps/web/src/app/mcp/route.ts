import { forwarded } from "@/lib/forward";

// The MCP server, for AI assistants. See /developers.
export const { GET, POST, DELETE, OPTIONS } = forwarded(() => "/mcp");
