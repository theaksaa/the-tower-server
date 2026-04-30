import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { createGameEngine } from "../../engine/gameEngine.js";

const nextEncounterRequestSchema = z.object({
  encountersCleared: z.number().int().nonnegative()
});

function sendRunError(error: unknown) {
  if (error instanceof z.ZodError) {
    return {
      statusCode: 400,
      body: {
        error: "invalid_next_encounter_request",
        message: error.issues[0]?.message ?? "Next encounter request is invalid."
      }
    };
  }

  return {
    statusCode: 500,
    body: {
      error: "server_error",
      message: error instanceof Error ? error.message : "Unexpected server error."
    }
  };
}

export const runRoutes: FastifyPluginAsync = async (app) => {
  const gameEngine = createGameEngine();

  app.get("/run/config", async () => {
    return gameEngine.createRunConfig();
  });

  app.post("/run/next-encounter", async (request, reply) => {
    try {
      const { encountersCleared } = nextEncounterRequestSchema.parse(request.body);

      return gameEngine.createNextEncounter(encountersCleared);
    } catch (error) {
      const runError = sendRunError(error);
      return reply.code(runError.statusCode).send(runError.body);
    }
  });
};
