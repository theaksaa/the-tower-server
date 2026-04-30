import { z } from "zod";
import {
  coinRewardScaling,
  endlessMode,
  encounters,
  getMove,
  heroes,
  levelProgression,
  moveRegistry,
  shopItems,
  xpRewardScaling
} from "./config.js";
import type {
  BattleState,
  Monster,
  MonsterMoveResponse,
  NextEncounterResponse,
  RunConfig,
  Stats
} from "./types.js";
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
  createNextEncounter(encountersCleared: number): NextEncounterResponse;
  selectMonsterMove(state: BattleState): MonsterMoveResponse;
};

function getMonster(monsterId: string): Monster {
  const baseMonsterId = monsterId.replace(/_endless_\d+$/, "");
  const monster = encounters.find((entry) => entry.id === baseMonsterId);

  if (!monster) {
    throw new Error("monster_not_found");
  }

  return monster;
}

function getRandomItem<T>(items: readonly T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

function scaleStat(value: number, multiplier: number) {
  return Math.max(1, Math.round(value * multiplier));
}

function scaleStats(baseStats: Stats, healthMultiplier: number, statMultiplier: number): Stats {
  return {
    health: scaleStat(baseStats.health, healthMultiplier),
    attack: scaleStat(baseStats.attack, statMultiplier),
    defense: scaleStat(baseStats.defense, statMultiplier),
    magic: scaleStat(baseStats.magic, statMultiplier)
  };
}

function createScaledEncounter(baseMonster: Monster, loopIndex: number): Monster {
  const healthMultiplier = endlessMode.healthMultiplierPerLoop ** loopIndex;
  const statMultiplier = endlessMode.statMultiplierPerLoop ** loopIndex;
  const rewardMultiplier = endlessMode.rewardMultiplierPerLoop ** loopIndex;

  return {
    ...baseMonster,
    id: `${baseMonster.id}_endless_${loopIndex + 1}`,
    name: loopIndex === 0 ? baseMonster.name : `${baseMonster.name} +${loopIndex}`,
    description:
      loopIndex === 0
        ? baseMonster.description
        : `${baseMonster.description} Empowered by endless ascent.`,
    stats: scaleStats(baseMonster.stats, healthMultiplier, statMultiplier),
    xpReward: Math.max(1, Math.round(baseMonster.xpReward * rewardMultiplier)),
    coinReward: Math.max(1, Math.round(baseMonster.coinReward * rewardMultiplier))
  };
}

export function createGameEngine(): GameEngine {
  return {
    createRunConfig() {
      return {
        runId: createId(),
        encounters,
        heroes,
        levelProgression,
        endlessMode,
        xpRewardScaling,
        coinRewardScaling,
        shopItems,
        moveRegistry
      };
    },
    createNextEncounter(encountersCleared) {
      const encounterNumber = encountersCleared + 1;
      const encounterIndex = encountersCleared % encounters.length;
      const loopIndex = Math.floor(encountersCleared / endlessMode.encountersPerLoop);
      const baseMonster = encounters[encounterIndex];

      if (!baseMonster) {
        throw new Error("encounter_not_found");
      }

      return {
        encounterNumber,
        loopNumber: loopIndex + 1,
        baseMonsterId: baseMonster.id,
        monster: createScaledEncounter(baseMonster, loopIndex)
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
