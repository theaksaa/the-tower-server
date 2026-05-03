import type { ServerOptions } from "node:https";
import Fastify from "fastify";
import { battleRoutes } from "./api/routes/battle.routes.js";
import { healthRoutes } from "./api/routes/health.routes.js";
import { runRoutes } from "./api/routes/run.routes.js";

type BuildAppOptions = {
  https?: ServerOptions;
};

function registerRoutes(app: ReturnType<typeof Fastify>) {
  app.register(healthRoutes);
  app.register(runRoutes);
  app.register(battleRoutes);

  return app;
}

export function buildApp(options?: BuildAppOptions) {
  if (options?.https) {
    return registerRoutes(
      Fastify({
        logger: true,
        https: options.https
      })
    );
  }

  return registerRoutes(
    Fastify({
      logger: true
    })
  );
}
