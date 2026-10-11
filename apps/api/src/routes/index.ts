import type { FastifyInstance } from "fastify";
import { authRoutes } from "./auth";
import { businessRoutes } from "./business";

/** Every area registers its endpoints here. */
export async function registerRoutes(app: FastifyInstance) {
  await authRoutes(app);
  await businessRoutes(app);
}
