import type {
  CoinRewardScaling,
  HeroDefaults,
  Monster,
  Move,
  MoveRegistry,
  ShopItem,
  Stats,
  UpgradeableStatKey,
  XpRewardScaling
} from "./types.js";

type MoveDefinition = Omit<Move, "spriteKey"> & {
  spriteKey?: string;
};

const createStats = (
  health: number,
  attack: number,
  defense: number,
  magic: number
): Stats => ({
  health,
  attack,
  defense,
  magic
});

const createMoveRegistry = (
  definitions: Record<string, MoveDefinition>
): MoveRegistry =>
  Object.fromEntries(
    Object.entries(definitions).map(([moveId, move]) => [
      moveId,
      {
        ...move,
        spriteKey: move.spriteKey ?? moveId
      }
    ])
  );

const knightHero: HeroDefaults = {
  id: "knight",
  name: "Knight",
  description: "A durable frontline fighter with steady offense and self-sustain.",
  spriteKey: "knight",
  baseStats: createStats(120, 18, 10, 12),
  statsPerLevel: createStats(18, 4, 3, 3),
  moves: ["slash", "shield_up", "battle_cry", "second_wind"]
};

export const heroes: HeroDefaults[] = [
  knightHero,
  {
    id: "berserker",
    name: "Berserker",
    description: "An aggressive bruiser with bigger physical scaling and lighter defenses.",
    spriteKey: "solider",
    baseStats: createStats(132, 22, 7, 8),
    statsPerLevel: createStats(20, 5, 2, 2),
    moves: ["slash", "battle_cry", "headbutt", "second_wind"]
  },
  {
    id: "spellblade",
    name: "Spellblade",
    description: "A hybrid duelist that mixes weapon strikes with flexible magic utility.",
    spriteKey: "priest",
    baseStats: createStats(108, 15, 9, 18),
    statsPerLevel: createStats(16, 3, 2, 4),
    moves: ["slash", "firebolt", "arcane_surge", "second_wind"]
  }
];

export const xpTable = [0, 100, 250, 450, 700];

export const xpRewardScaling: XpRewardScaling = {
  multiplierPerKill: 0.95,
  minimumReward: 25
};

export const coinRewardScaling: CoinRewardScaling = {
  multiplierPerKill: 0.9,
  minimumReward: 5
};

export const moveRegistry: MoveRegistry = createMoveRegistry({
  slash: {
    id: "slash",
    name: "Slash",
    description: "Moderate physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 15,
    statMultiplier: 1,
    statModifier: null,
    hpCost: null
  },
  shield_up: {
    id: "shield_up",
    name: "Shield Up",
    description: "Raises the user's Defense for two turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "defense",
      value: 6,
      durationTurns: 2
    },
    hpCost: null
  },
  battle_cry: {
    id: "battle_cry",
    name: "Battle Cry",
    description: "Raises the user's Attack for two turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "attack",
      value: 6,
      durationTurns: 2
    },
    hpCost: null
  },
  second_wind: {
    id: "second_wind",
    name: "Second Wind",
    description: "Moderate heal that scales with Magic.",
    type: "magic",
    effect: "heal",
    target: "self",
    basePower: 18,
    statMultiplier: 0.8,
    statModifier: null,
    hpCost: null
  },
  rusty_blade: {
    id: "rusty_blade",
    name: "Rusty Blade",
    description: "Moderate physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 14,
    statMultiplier: 1,
    statModifier: null,
    hpCost: null
  },
  dirty_kick: {
    id: "dirty_kick",
    name: "Dirty Kick",
    description: "Light damage and lowers the target's Defense.",
    type: "physical",
    effect: "damage_and_stat_modifier",
    target: "opponent",
    basePower: 8,
    statMultiplier: 0.7,
    statModifier: {
      stat: "defense",
      value: -5,
      durationTurns: 2
    },
    hpCost: null
  },
  frenzy: {
    id: "frenzy",
    name: "Frenzy",
    description: "Raises the user's Attack for two turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "attack",
      value: 6,
      durationTurns: 2
    },
    hpCost: null
  },
  headbutt: {
    id: "headbutt",
    name: "Headbutt",
    description: "Heavy physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 26,
    statMultiplier: 1.2,
    statModifier: null,
    hpCost: null
  },
  bite: {
    id: "bite",
    name: "Bite",
    description: "Moderate physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 14,
    statMultiplier: 1,
    statModifier: null,
    hpCost: null
  },
  web_throw: {
    id: "web_throw",
    name: "Web Throw",
    description: "Light damage and lowers the target's Defense.",
    type: "physical",
    effect: "damage_and_stat_modifier",
    target: "opponent",
    basePower: 8,
    statMultiplier: 0.7,
    statModifier: {
      stat: "defense",
      value: -5,
      durationTurns: 2
    },
    hpCost: null
  },
  pounce: {
    id: "pounce",
    name: "Pounce",
    description: "Heavy physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 26,
    statMultiplier: 1.2,
    statModifier: null,
    hpCost: null
  },
  skitter: {
    id: "skitter",
    name: "Skitter",
    description: "Raises the user's Defense for two turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "defense",
      value: 6,
      durationTurns: 2
    },
    hpCost: null
  },
  firebolt: {
    id: "firebolt",
    name: "Firebolt",
    description: "Moderate magic damage.",
    type: "magic",
    effect: "damage",
    target: "opponent",
    basePower: 18,
    statMultiplier: 1,
    statModifier: null,
    hpCost: null
  },
  arcane_surge: {
    id: "arcane_surge",
    name: "Arcane Surge",
    description: "Raises the user's Magic for two turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "magic",
      value: 6,
      durationTurns: 2
    },
    hpCost: null
  },
  mana_drain: {
    id: "mana_drain",
    name: "Mana Drain",
    description: "Light magic damage and lowers the target's Magic.",
    type: "magic",
    effect: "damage_and_stat_modifier",
    target: "opponent",
    basePower: 10,
    statMultiplier: 0.7,
    statModifier: {
      stat: "magic",
      value: -5,
      durationTurns: 2
    },
    hpCost: null
  },
  hex_shield: {
    id: "hex_shield",
    name: "Hex Shield",
    description: "Raises the user's Defense for two turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "defense",
      value: 6,
      durationTurns: 2
    },
    hpCost: null
  },
  shadow_bolt: {
    id: "shadow_bolt",
    name: "Shadow Bolt",
    description: "Heavy magic damage.",
    type: "magic",
    effect: "damage",
    target: "opponent",
    basePower: 28,
    statMultiplier: 1.2,
    statModifier: null,
    hpCost: null
  },
  drain_life: {
    id: "drain_life",
    name: "Drain Life",
    description: "Deals magic damage and heals for the same amount.",
    type: "magic",
    effect: "drain",
    target: "opponent",
    basePower: 10,
    statMultiplier: 0.7,
    statModifier: null,
    hpCost: null
  },
  curse: {
    id: "curse",
    name: "Curse",
    description: "Lowers the target's Attack for two turns.",
    type: "status",
    effect: "stat_modifier",
    target: "opponent",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "attack",
      value: -6,
      durationTurns: 2
    },
    hpCost: null
  },
  dark_pact: {
    id: "dark_pact",
    name: "Dark Pact",
    description: "Raises Magic at the cost of HP.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "magic",
      value: 8,
      durationTurns: 2
    },
    hpCost: 10
  },
  flame_breath: {
    id: "flame_breath",
    name: "Flame Breath",
    description: "Heavy magic damage.",
    type: "magic",
    effect: "damage",
    target: "opponent",
    basePower: 30,
    statMultiplier: 1.3,
    statModifier: null,
    hpCost: null
  },
  claw_swipe: {
    id: "claw_swipe",
    name: "Claw Swipe",
    description: "Moderate physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 18,
    statMultiplier: 1,
    statModifier: null,
    hpCost: null
  },
  intimidate: {
    id: "intimidate",
    name: "Intimidate",
    description: "Lowers the target's Attack for two turns.",
    type: "status",
    effect: "stat_modifier",
    target: "opponent",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "attack",
      value: -6,
      durationTurns: 2
    },
    hpCost: null
  },
  dragon_scales: {
    id: "dragon_scales",
    name: "Dragon Scales",
    description: "Raises the user's Defense for two turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "defense",
      value: 8,
      durationTurns: 2
    },
    hpCost: null
  }
});

function createStatShopItem(
  id: string,
  name: string,
  description: string,
  spriteKey: string,
  cost: number,
  stat: UpgradeableStatKey,
  value: number
) {
  return {
    id,
    name,
    description,
    spriteKey,
    cost,
    repeatable: true,
    type: "stat" as const,
    stat,
    value
  };
}

function createMoveShopItem(
  id: string,
  name: string,
  description: string,
  cost: number,
  moveId: string
) {
  const move = moveRegistry[moveId];

  if (!move) {
    throw new Error(`unknown_move_shop_item:${moveId}`);
  }

  return {
    id,
    name,
    description,
    spriteKey: move.spriteKey,
    cost,
    repeatable: false as const,
    type: "move" as const,
    moveId
  };
}

export const encounters: Monster[] = [
  {
    id: "goblin_warrior",
    name: "Goblin Warrior",
    description:
      "A scrappy fighter who wins through cheap shots and reckless aggression.",
    stats: createStats(70, 15, 7, 4),
    moves: ["rusty_blade", "dirty_kick", "frenzy", "headbutt"],
    learnableMoves: ["rusty_blade", "dirty_kick", "frenzy", "headbutt"],
    xpReward: 80,
    coinReward: 40,
    spriteKey: "orc"
  },
  {
    id: "giant_spider",
    name: "Giant Spider",
    description: "A patient hunter that weakens armor before going for the kill.",
    stats: createStats(95, 18, 10, 5),
    moves: ["bite", "web_throw", "pounce", "skitter"],
    learnableMoves: ["bite", "web_throw", "pounce", "skitter"],
    xpReward: 110,
    coinReward: 55,
    spriteKey: "orc_rider"
  },
  {
    id: "goblin_mage",
    name: "Goblin Mage",
    description: "A volatile caster that alternates between wards and hexes.",
    stats: createStats(88, 8, 8, 18),
    moves: ["firebolt", "arcane_surge", "mana_drain", "hex_shield"],
    learnableMoves: ["firebolt", "arcane_surge", "mana_drain", "hex_shield"],
    xpReward: 140,
    coinReward: 70,
    spriteKey: "armored_orc"
  },
  {
    id: "witch",
    name: "Witch",
    description: "An old battlefield sorcerer who steals life to stay upright.",
    stats: createStats(105, 7, 10, 22),
    moves: ["shadow_bolt", "drain_life", "curse", "dark_pact"],
    learnableMoves: ["shadow_bolt", "drain_life", "curse", "dark_pact"],
    xpReward: 180,
    coinReward: 90,
    spriteKey: "wizard"
  },
  {
    id: "dragon",
    name: "Dragon",
    description: "An ancient apex predator with crushing force and searing flame.",
    stats: createStats(170, 24, 18, 24),
    moves: ["flame_breath", "claw_swipe", "intimidate", "dragon_scales"],
    learnableMoves: ["flame_breath", "claw_swipe", "intimidate", "dragon_scales"],
    xpReward: 250,
    coinReward: 125,
    spriteKey: "werebear"
  }
];

export const shopItems: ShopItem[] = [
  createStatShopItem(
    "health_tonic",
    "Health Tonic",
    "Permanently increases max Health.",
    "health",
    35,
    "health",
    20
  ),
  createStatShopItem(
    "iron_grip",
    "Iron Grip",
    "Permanently increases Attack.",
    "attack",
    40,
    "attack",
    3
  ),
  createStatShopItem(
    "tower_shield",
    "Tower Shield",
    "Permanently increases Defense.",
    "defense",
    40,
    "defense",
    3
  ),
  createStatShopItem(
    "mage_signet",
    "Mage Signet",
    "Permanently increases Magic.",
    "magic",
    40,
    "magic",
    3
  ),
  createMoveShopItem(
    "buy_headbutt",
    "Headbutt Manual",
    "Unlocks Headbutt for the hero.",
    55,
    "headbutt"
  ),
  createMoveShopItem(
    "buy_firebolt",
    "Firebolt Tome",
    "Unlocks Firebolt for the hero.",
    55,
    "firebolt"
  ),
  createMoveShopItem(
    "buy_hex_shield",
    "Hex Shield Sigil",
    "Unlocks Hex Shield for the hero.",
    65,
    "hex_shield"
  ),
  createMoveShopItem(
    "buy_drain_life",
    "Drain Life Grimoire",
    "Unlocks Drain Life for the hero.",
    70,
    "drain_life"
  )
];

export function getMove(moveId: string): Move | undefined {
  return moveRegistry[moveId];
}
