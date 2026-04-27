import Fastify from "fastify";
import { battleRoutes } from "./api/routes/battle.routes.js";
import { healthRoutes } from "./api/routes/health.routes.js";
import { runRoutes } from "./api/routes/run.routes.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(healthRoutes);
  app.register(runRoutes);
  app.register(battleRoutes);

  return app;
}
