import "server-only";
import { agents, home } from "@billingease/contracts";
import { cache } from "react";
import { ApiFailure, call } from "./api";

/** Home's three numbers for the default period, once per request (the crumbs and the island share it). */
export const homeSummary = cache(async () => {
  try {
    return await call(home.summary);
  } catch (err) {
    if (err instanceof ApiFailure) return null;
    throw err;
  }
});

/** How many AI drafts are waiting for the person to check. */
export const pendingProposals = cache(async () => {
  try {
    return (await call(agents.proposals, { query: { status: "pending" } })).pending;
  } catch (err) {
    if (err instanceof ApiFailure) return 0;
    throw err;
  }
});
