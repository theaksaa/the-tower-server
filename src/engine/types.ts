export type StatKey = "attack" | "defense" | "magic";

export type Stats = {
  health: number;
  attack: number;
  defense: number;
  magic: number;
};

export type StatModifier = {
  stat: StatKey;
  value: number;
  durationTurns: number;
};

export type MoveType = "physical" | "magic" | "status";

export type MoveEffect =
  | "damage"
  | "heal"
  | "drain"
  | "stat_modifier"
  | "damage_and_stat_modifier";

export type MoveTarget = "self" | "opponent";

export type Move = {
  id: string;
  name: string;
  description: string;
  spriteKey: string;
  type: MoveType;
  effect: MoveEffect;
  target: MoveTarget;
  basePower: number;
  statMultiplier: number;
  statModifier: StatModifier | null;
  hpCost: number | null;
};

export type MoveRegistry = Record<string, Move>;

export type Monster = {
  id: string;
  name: string;
  description: string;
  stats: Stats;
  moves: string[];
  learnableMoves: string[];
  xpReward: number;
  spriteKey: string;
};

export type HeroDefaults = {
  id: string;
  name: string;
  description: string;
  spriteKey: string;
  baseStats: Stats;
  statsPerLevel: Stats;
  moves: string[];
};

export type RunConfig = {
  runId: string;
  encounters: Monster[];
  heroes: HeroDefaults[];
  xpTable: number[];
  moveRegistry: MoveRegistry;
};

export type BattleState = {
  monsterId: string;
  monsterCurrentHp: number;
  heroCurrentHp: number;
  heroMaxHp: number;
  heroStats: Stats;
  turnNumber: number;
  heroLastMoveId: string | null;
  monsterMoveHistory: string[];
};

export type MonsterMoveResponse = {
  moveId: string;
  move: Move;
};
