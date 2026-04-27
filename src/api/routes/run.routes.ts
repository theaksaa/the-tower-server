import type { FastifyPluginAsync } from "fastify";
import { createGameEngine } from "../../engine/gameEngine.js";

export const runRoutes: FastifyPluginAsync = async (app) => {
  const gameEngine = createGameEngine();

  app.get("/run/config", async () => {
    return gameEngine.createRunConfig();
  });
};
