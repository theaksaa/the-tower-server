import Fastify from "fastify";
import { healthRoutes } from "./api/routes/health.routes.js";
import { sessionRoutes } from "./api/routes/sessions.routes.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(healthRoutes);
  app.register(sessionRoutes, { prefix: "/api" });

  return app;
}
