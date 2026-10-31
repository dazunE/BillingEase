import { forwarded } from "@/lib/forward";

// The public REST API. See /developers.
export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = forwarded((_req, p) => `/v1${p.path ? `/${(p.path as string[]).map(encodeURIComponent).join("/")}` : ""}`);
