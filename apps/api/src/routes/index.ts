import type { FastifyInstance } from "fastify";
import { agentRoutes } from "./agents";
import { askRoutes } from "./ask";
import { captureRoutes } from "./capture";
import { statementRoutes } from "./statements";
import { authRoutes } from "./auth";
import { businessRoutes } from "./business";
import { comingInRoutes } from "./coming-in";
import { goingOutRoutes } from "./going-out";
import { homeRoutes } from "./home";
import { publicRoutes } from "../public";

/** Every area registers its endpoints here. */
export async function registerRoutes(app: FastifyInstance) {
  await authRoutes(app);
  await businessRoutes(app);
  await comingInRoutes(app);
  await goingOutRoutes(app);
  await homeRoutes(app);
  await askRoutes(app);
  await agentRoutes(app);
  await captureRoutes(app);
  await statementRoutes(app);
  // Last: the public API runs the handlers registered above.
  await publicRoutes(app);
}
