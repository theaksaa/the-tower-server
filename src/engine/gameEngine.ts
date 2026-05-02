import { z } from "zod";
import {
  coinRewardScaling,
  endlessMode,
  encounters,
  environmentRegistry,
  itemRegistry,
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

type ScoredMove = {
  move: NonNullable<ReturnType<typeof getMove>>;
  score: number;
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

function getLoopIndex(monsterId: string): number {
  const match = monsterId.match(/_endless_(\d+)$/);

  if (!match) {
    return 0;
  }

  const loopNumber = Number.parseInt(match[1], 10);
  return Number.isNaN(loopNumber) ? 0 : Math.max(0, loopNumber - 1);
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
    name: baseMonster.name,
    description:
      loopIndex === 0
        ? baseMonster.description
        : `${baseMonster.description} Empowered by endless ascent.`,
    stats: scaleStats(baseMonster.stats, healthMultiplier, statMultiplier),
    xpReward: Math.max(1, Math.round(baseMonster.xpReward * rewardMultiplier)),
    coinReward: Math.max(1, Math.round(baseMonster.coinReward * rewardMultiplier))
  };
}

function getMonsterForBattle(monsterId: string): Monster {
  const baseMonster = getMonster(monsterId);
  return createScaledEncounter(baseMonster, getLoopIndex(monsterId));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getMoveStatValue(moveType: "physical" | "magic" | "status", stats: Stats) {
  if (moveType === "physical") {
    return stats.attack;
  }

  if (moveType === "magic") {
    return stats.magic;
  }

  return 0;
}

function estimateDamage(move: NonNullable<ReturnType<typeof getMove>>, stats: Stats) {
  return move.basePower + getMoveStatValue(move.type, stats) * move.statMultiplier;
}

function estimateHealing(move: NonNullable<ReturnType<typeof getMove>>, monster: Monster) {
  if (move.effect === "heal" || move.effect === "drain") {
    return move.basePower + monster.stats.magic * move.statMultiplier;
  }

  return 0;
}

function countRecentMoveUses(moveHistory: string[], moveId: string, recentTurns: number) {
  return moveHistory.slice(-recentTurns).filter((entry) => entry === moveId).length;
}

function getStrongestDamageValue(
  moves: readonly NonNullable<ReturnType<typeof getMove>>[],
  monster: Monster
) {
  const damageMoves = moves.filter(
    (move) => move.effect === "damage" || move.effect === "damage_and_stat_modifier" || move.effect === "drain"
  );

  if (damageMoves.length === 0) {
    return 0;
  }

  return Math.max(...damageMoves.map((move) => estimateDamage(move, monster.stats)));
}

function scoreMonsterMove(
  move: NonNullable<ReturnType<typeof getMove>>,
  state: BattleState,
  monster: Monster,
  validMoves: readonly NonNullable<ReturnType<typeof getMove>>[]
) {
  const monsterMaxHp = monster.stats.health;
  const monsterCurrentHp = clamp(state.monsterCurrentHp, 0, monsterMaxHp);
  const heroCurrentHp = Math.max(0, state.heroCurrentHp);
  const missingHp = Math.max(0, monsterMaxHp - monsterCurrentHp);
  const hpRatio = monsterMaxHp === 0 ? 0 : monsterCurrentHp / monsterMaxHp;
  const lastMoveId = state.monsterMoveHistory.at(-1) ?? null;
  const repeatedRecently = countRecentMoveUses(state.monsterMoveHistory, move.id, 2);
  const strongestDamageValue = getStrongestDamageValue(validMoves, monster);
  const projectedDamage = estimateDamage(move, monster.stats);
  const projectedHealing = Math.min(missingHp, estimateHealing(move, monster));
  const heroPressure = Math.max(state.heroStats.attack, state.heroStats.magic);

  let score = 1;

  if (
    move.effect === "damage" ||
    move.effect === "damage_and_stat_modifier" ||
    move.effect === "drain"
  ) {
    score += projectedDamage;

    if (heroCurrentHp > 0 && projectedDamage >= heroCurrentHp) {
      score += 100;
    } else if (heroCurrentHp > 0) {
      score += (projectedDamage / heroCurrentHp) * 18;
    }
  }

  if (move.effect === "heal") {
    score += projectedHealing * (hpRatio <= 0.35 ? 4.5 : hpRatio <= 0.55 ? 3 : 1.2);

    if (hpRatio <= 0.3) {
      score += 35;
    }
  }

  if (move.effect === "drain") {
    score += projectedHealing * (hpRatio <= 0.45 ? 2.8 : 1.5);

    if (hpRatio <= 0.35) {
      score += 24;
    }
  }

  if (move.effect === "stat_modifier" || move.effect === "damage_and_stat_modifier") {
    const modifier = move.statModifier;

    if (modifier) {
      const modifierMagnitude = Math.abs(modifier.value) * modifier.durationTurns;

      if (move.target === "self" && modifier.value > 0) {
        if (modifier.stat === "health") {
          score += modifierMagnitude * (hpRatio <= 0.45 ? 2.4 : 1.1);
        }

        if (modifier.stat === "defense") {
          score += modifierMagnitude * (hpRatio <= 0.55 ? 2.2 : 1.2);
          score += heroPressure * 0.5;
        }

        if (modifier.stat === "attack" || modifier.stat === "magic") {
          const damageAlignment = validMoves.some(
            (candidate) =>
              candidate.type === modifier.stat &&
              (candidate.effect === "damage" ||
                candidate.effect === "damage_and_stat_modifier" ||
                candidate.effect === "drain")
          );

          score += modifierMagnitude * (state.turnNumber <= 3 ? 2.1 : 1.1);

          if (damageAlignment) {
            score += strongestDamageValue * 0.35;
          }
        }
      }

      if (move.target === "opponent" && modifier.value < 0) {
        if (modifier.stat === "health") {
          score += modifierMagnitude * (state.turnNumber <= 3 ? 2.2 : 1.2);
          score += heroCurrentHp > 0 ? modifierMagnitude / heroCurrentHp : 0;
        }

        if (modifier.stat === "defense") {
          score += modifierMagnitude * 1.6;
          score += strongestDamageValue * 0.25;
        }

        if (modifier.stat === "attack") {
          score += modifierMagnitude * (hpRatio <= 0.6 ? 1.8 : 1.1);
          score += state.heroStats.attack * 0.8;
        }

        if (modifier.stat === "magic") {
          score += modifierMagnitude * 1.2;
          score += state.heroStats.magic * 0.8;
        }
      }
    }
  }

  if (move.hpCost !== null) {
    score -= move.hpCost * (hpRatio <= 0.4 ? 3 : 1.2);
  }

  if (move.effect === "heal" && missingHp <= 0) {
    score *= 0.1;
  }

  if (move.target === "self" && repeatedRecently > 0) {
    score *= 0.6;
  }

  if (lastMoveId === move.id) {
    score *= move.effect === "heal" || move.effect === "drain" ? 0.85 : 0.7;
  }

  if (hpRatio <= 0.3 && move.effect === "stat_modifier" && move.target === "self") {
    const isDefensive = move.statModifier?.stat === "defense";
    score *= isDefensive ? 1.15 : 0.7;
  }

  return Math.max(0.1, score);
}

function pickWeightedMove(scoredMoves: readonly ScoredMove[]) {
  const totalScore = scoredMoves.reduce((sum, entry) => sum + entry.score, 0);

  if (totalScore <= 0) {
    return getRandomItem(scoredMoves).move;
  }

  let roll = Math.random() * totalScore;

  for (const entry of scoredMoves) {
    roll -= entry.score;

    if (roll <= 0) {
      return entry.move;
    }
  }

  return scoredMoves[scoredMoves.length - 1]?.move ?? getRandomItem(scoredMoves).move;
}

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function getLoopEncounterOrder(loopIndex: number): Monster[] {
  if (loopIndex === 0) {
    return encounters;
  }

  const shuffled = [...encounters];
  const random = createSeededRandom((loopIndex + 1) * 2654435761);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }

  return shuffled;
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
        moveRegistry,
        itemRegistry,
        environmentRegistry
      };
    },
    createNextEncounter(encountersCleared) {
      const encounterNumber = encountersCleared + 1;
      const loopIndex = Math.floor(encountersCleared / endlessMode.encountersPerLoop);
      const encounterIndexInLoop = encountersCleared % endlessMode.encountersPerLoop;
      const loopEncounters = getLoopEncounterOrder(loopIndex);
      const baseMonster = loopEncounters[encounterIndexInLoop % loopEncounters.length];

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
      const monster = getMonsterForBattle(state.monsterId);
      const validMoves = monster.moves
        .map((moveId) => getMove(moveId))
        .filter((move): move is NonNullable<typeof move> => move !== undefined);

      if (validMoves.length === 0) {
        throw new Error("monster_has_no_valid_moves");
      }

      const scoredMoves = validMoves.map((move) => ({
        move,
        score: scoreMonsterMove(move, state, monster, validMoves)
      }));
      const move = pickWeightedMove(scoredMoves);

      return {
        moveId: move.id,
        move
      };
    }
  };
}
