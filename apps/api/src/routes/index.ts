import type { FastifyInstance } from "fastify";
import { askRoutes } from "./ask";
import { authRoutes } from "./auth";
import { businessRoutes } from "./business";
import { comingInRoutes } from "./coming-in";
import { goingOutRoutes } from "./going-out";
import { homeRoutes } from "./home";

/** Every area registers its endpoints here. */
export async function registerRoutes(app: FastifyInstance) {
  await authRoutes(app);
  await businessRoutes(app);
  await comingInRoutes(app);
  await goingOutRoutes(app);
  await homeRoutes(app);
  await askRoutes(app);
}
