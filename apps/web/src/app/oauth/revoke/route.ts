import { forwarded } from "@/lib/forward";

export const { POST, OPTIONS } = forwarded(() => "/oauth/revoke");
