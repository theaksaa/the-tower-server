import type { FastifyPluginAsync } from "fastify";
import { createAnonymousSession } from "../../data/repositories/sessionRepository.js";
import { createGameEngine } from "../../engine/gameEngine.js";

export const sessionRoutes: FastifyPluginAsync = async (app) => {
  const gameEngine = createGameEngine();

  app.post("/sessions", async () => {
    const session = await createAnonymousSession();

    gameEngine.onSessionCreated(session.id);

    return {
      sessionId: session.id,
      token: session.token
    };
  });
};
