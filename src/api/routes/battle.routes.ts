import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import {
  BattleStateSchema,
  createGameEngine,
  type BattleState
} from "../../engine/gameEngine.js";

const battleQuerySchema = z.object({
  state: z.string().min(1)
});

function sendBattleError(reply: FastifyReply, error: unknown) {
  if (error instanceof z.ZodError) {
    return reply.code(400).send({
      error: "invalid_battle_state",
      message: error.issues[0]?.message ?? "Battle state is invalid."
    });
  }

  if (error instanceof Error && error.message === "monster_not_found") {
    return reply.code(404).send({
      error: "monster_not_found",
      message: "The requested monster does not exist in the run configuration."
    });
  }

  if (error instanceof Error && error.message === "monster_has_no_valid_moves") {
    return reply.code(500).send({
      error: "server_error",
      message: "The monster does not have any valid moves configured."
    });
  }

  if (error instanceof Error) {
    return reply.code(400).send({
      error: "invalid_battle_state",
      message: error.message
    });
  }

  return reply.code(500).send({
    error: "server_error",
    message: "Unexpected server error."
  });
}

function parseBattleStateFromQuery(state: string): BattleState {
  let parsedState: unknown;

  try {
    parsedState = JSON.parse(state);
  } catch {
    throw new Error("Battle state must be valid JSON.");
  }

  return BattleStateSchema.parse(parsedState);
}

export const battleRoutes: FastifyPluginAsync = async (app) => {
  const gameEngine = createGameEngine();

  app.get("/battle/monster-move", async (request, reply) => {
    try {
      const { state } = battleQuerySchema.parse(request.query);
      const battleState = parseBattleStateFromQuery(state);

      return gameEngine.selectMonsterMove(battleState);
    } catch (error) {
      return sendBattleError(reply, error);
    }
  });

  app.post("/battle/monster-move", async (request, reply) => {
    try {
      const battleState = BattleStateSchema.parse(request.body);

      return gameEngine.selectMonsterMove(battleState);
    } catch (error) {
      return sendBattleError(reply, error);
    }
  });
};
