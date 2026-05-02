export type StatKey = "attack" | "defense" | "magic";

export type UpgradeableStatKey = StatKey | "health";

export type Stats = {
  health: number;
  attack: number;
  defense: number;
  magic: number;
};

export type StatModifier = {
  stat: UpgradeableStatKey;
  value: number;
  durationTurns: number;
};

export type ItemStatModifier = {
  stat: UpgradeableStatKey;
  value: number;
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

export type ItemTarget = MoveTarget;

export type Item = {
  id: string;
  name: string;
  description: string;
  spriteKey: string;
  target: ItemTarget;
  statModifier: ItemStatModifier;
};

export type ItemRegistry = Record<string, Item>;

export type EnvironmentTurnEffect =
  | {
      type: "damage" | "heal";
      value: number;
    }
  | {
      type: "stat_modifier";
      stat: StatKey;
      value: number;
    };

export type EnvironmentSideEffects = {
  statModifiers: Partial<Record<UpgradeableStatKey, number>>;
  turnEffect: EnvironmentTurnEffect | null;
};

export type Environment = {
  id: string;
  name: string;
  description: string;
  spriteKey: string;
  heroEffects: EnvironmentSideEffects;
  monsterEffects: EnvironmentSideEffects;
};

export type EnvironmentRegistry = Record<string, Environment>;

export type Monster = {
  id: string;
  name: string;
  description: string;
  environmentId: string;
  stats: Stats;
  moves: string[];
  equippedItems: string[];
  inventoryItems: string[];
  learnableMoves: string[];
  xpReward: number;
  coinReward: number;
  spriteKey: string;
};

export type CoinRewardScaling = {
  multiplierPerKill: number;
  minimumReward: number;
};

export type XpRewardScaling = {
  multiplierPerKill: number;
  minimumReward: number;
};

export type LevelProgression = {
  baseXpForNextLevel: number;
  additionalXpPerLevel: number;
};

export type EndlessModeConfig = {
  enabled: boolean;
  encountersPerLoop: number;
  healthMultiplierPerLoop: number;
  statMultiplierPerLoop: number;
  rewardMultiplierPerLoop: number;
};

export type HeroDefaults = {
  id: string;
  name: string;
  description: string;
  spriteKey: string;
  baseStats: Stats;
  statsPerLevel: Stats;
  moves: string[];
  equippedItems: string[];
  inventoryItems: string[];
};

export type ShopItemBase = {
  id: string;
  name: string;
  description: string;
  spriteKey: string;
  cost: number;
  repeatable: boolean;
};

export type StatShopItem = ShopItemBase & {
  type: "stat";
  stat: UpgradeableStatKey;
  value: number;
};

export type MoveShopItem = ShopItemBase & {
  type: "move";
  moveId: string;
  repeatable: false;
};

export type InventoryShopItem = ShopItemBase & {
  type: "item";
  itemId: string;
  repeatable: false;
};

export type ShopItem = StatShopItem | MoveShopItem | InventoryShopItem;

export type RunConfig = {
  runId: string;
  encounters: Monster[];
  heroes: HeroDefaults[];
  levelProgression: LevelProgression;
  endlessMode: EndlessModeConfig;
  xpRewardScaling: XpRewardScaling;
  coinRewardScaling: CoinRewardScaling;
  shopItems: ShopItem[];
  moveRegistry: MoveRegistry;
  itemRegistry: ItemRegistry;
  environmentRegistry: EnvironmentRegistry;
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

export type NextEncounterRequest = {
  encountersCleared: number;
};

export type NextEncounterResponse = {
  encounterNumber: number;
  loopNumber: number;
  baseMonsterId: string;
  monster: Monster;
};
