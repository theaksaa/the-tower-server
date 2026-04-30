import { z } from "zod";
import {
  coinRewardScaling,
  encounters,
  getMove,
  heroes,
  levelProgression,
  moveRegistry,
  shopItems,
  xpRewardScaling
} from "./config.js";
import type { BattleState, Monster, MonsterMoveResponse, RunConfig } from "./types.js";
import { createId } from "../utils/id.js";

const statsSchema = z.object({
  health: z.number().finite().nonnegative(),
  attack: z.number().finite().nonnegative(),
  defense: z.number().finite().nonnegative(),
  magic: z.number().finite().nonnegative()
});

export const BattleStateSchema = z.object({
  monsterId: z.string().min(1),
  monsterCurrentHp: z.number().finite().nonnegative(),
  heroCurrentHp: z.number().finite().nonnegative(),
  heroMaxHp: z.number().finite().positive(),
  heroStats: statsSchema,
  turnNumber: z.number().int().positive(),
  heroLastMoveId: z.string().min(1).nullable(),
  monsterMoveHistory: z.array(z.string().min(1))
});

export type { BattleState } from "./types.js";

export type GameEngine = {
  createRunConfig(): RunConfig;
  selectMonsterMove(state: BattleState): MonsterMoveResponse;
};

function getMonster(monsterId: string): Monster {
  const monster = encounters.find((entry) => entry.id === monsterId);

  if (!monster) {
    throw new Error("monster_not_found");
  }

  return monster;
}

function getRandomItem<T>(items: readonly T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export function createGameEngine(): GameEngine {
  return {
    createRunConfig() {
      return {
        runId: createId(),
        encounters,
        heroes,
        levelProgression,
        xpRewardScaling,
        coinRewardScaling,
        shopItems,
        moveRegistry
      };
    },
    selectMonsterMove(state) {
      const monster = getMonster(state.monsterId);
      const validMoves = monster.moves
        .map((moveId) => getMove(moveId))
        .filter((move): move is NonNullable<typeof move> => move !== undefined);

      if (validMoves.length === 0) {
        throw new Error("monster_has_no_valid_moves");
      }

      const move = getRandomItem(validMoves);

      return {
        moveId: move.id,
        move
      };
    }
  };
}
