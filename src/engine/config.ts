import type {
  CoinRewardScaling,
  EndlessModeConfig,
  Environment,
  EnvironmentRegistry,
  HeroDefaults,
  Item,
  ItemRegistry,
  LevelProgression,
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

type ItemDefinition = Omit<Item, "spriteKey"> & {
  spriteKey?: string;
};

type EnvironmentDefinition = Omit<Environment, "spriteKey"> & {
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

const createItemRegistry = (
  definitions: Record<string, ItemDefinition>
): ItemRegistry =>
  Object.fromEntries(
    Object.entries(definitions).map(([itemId, item]) => [
      itemId,
      {
        ...item,
        spriteKey: item.spriteKey ?? itemId
      }
    ])
  );

const createEnvironmentRegistry = (
  definitions: Record<string, EnvironmentDefinition>
): EnvironmentRegistry =>
  Object.fromEntries(
    Object.entries(definitions).map(([environmentId, environment]) => [
      environmentId,
      {
        ...environment,
        spriteKey: environment.spriteKey ?? environmentId
      }
    ])
  );

export const levelProgression: LevelProgression = {
  baseXpForNextLevel: 115,
  additionalXpPerLevel: 65
};

export const endlessMode: EndlessModeConfig = {
  enabled: true,
  encountersPerLoop: 5,
  healthMultiplierPerLoop: 1.16,
  statMultiplierPerLoop: 1.08,
  rewardMultiplierPerLoop: 1.1
};

export const xpRewardScaling: XpRewardScaling = {
  multiplierPerKill: 0.92,
  minimumReward: 30
};

export const coinRewardScaling: CoinRewardScaling = {
  multiplierPerKill: 0.85,
  minimumReward: 10
};

export const moveRegistry: MoveRegistry = createMoveRegistry({
  slash: {
    id: "slash",
    name: "Slash",
    description: "Reliable physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 10,
    statMultiplier: 0.75,
    statModifier: null,
    hpCost: null
  },
  shield_up: {
    id: "shield_up",
    name: "Shield Up",
    description: "Raises the user's Defense for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "defense",
      value: 3,
      durationTurns: 3
    },
    hpCost: null
  },
  battle_cry: {
    id: "battle_cry",
    name: "Battle Cry",
    description: "Raises the user's Attack for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "attack",
      value: 3,
      durationTurns: 3
    },
    hpCost: null
  },
  second_wind: {
    id: "second_wind",
    name: "Second Wind",
    description: "Small heal that scales with Magic.",
    type: "magic",
    effect: "heal",
    target: "self",
    basePower: 10,
    statMultiplier: 0.55,
    statModifier: null,
    hpCost: null
  },
  basic_heal: {
    id: "basic_heal",
    name: "Basic Heal",
    description: "Small heal. Useful, but not strong enough to stall forever.",
    type: "magic",
    effect: "heal",
    target: "self",
    basePower: 9,
    statMultiplier: 0.45,
    statModifier: null,
    hpCost: null
  },
  goblin_patch: {
    id: "goblin_patch",
    name: "Goblin Patch",
    description: "Small self-heal.",
    type: "magic",
    effect: "heal",
    target: "self",
    basePower: 7,
    statMultiplier: 0.3,
    statModifier: null,
    hpCost: null
  },
  cocoon_rest: {
    id: "cocoon_rest",
    name: "Cocoon Rest",
    description: "Small self-heal.",
    type: "magic",
    effect: "heal",
    target: "self",
    basePower: 8,
    statMultiplier: 0.3,
    statModifier: null,
    hpCost: null
  },
  dark_mend: {
    id: "dark_mend",
    name: "Dark Mend",
    description: "Small magic heal.",
    type: "magic",
    effect: "heal",
    target: "self",
    basePower: 9,
    statMultiplier: 0.4,
    statModifier: null,
    hpCost: null
  },
  witch_brew: {
    id: "witch_brew",
    name: "Witch Brew",
    description: "Medium magic heal.",
    type: "magic",
    effect: "heal",
    target: "self",
    basePower: 10,
    statMultiplier: 0.45,
    statModifier: null,
    hpCost: null
  },
  dragon_regen: {
    id: "dragon_regen",
    name: "Dragon Regen",
    description: "Medium self-heal for the final boss.",
    type: "magic",
    effect: "heal",
    target: "self",
    basePower: 12,
    statMultiplier: 0.45,
    statModifier: null,
    hpCost: null
  },
  quick_shot: {
    id: "quick_shot",
    name: "Quick Shot",
    description: "Light physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 8,
    statMultiplier: 0.7,
    statModifier: null,
    hpCost: null
  },
  piercing_arrow: {
    id: "piercing_arrow",
    name: "Piercing Arrow",
    description: "Light damage and lowers the target's Defense.",
    type: "physical",
    effect: "damage_and_stat_modifier",
    target: "opponent",
    basePower: 8,
    statMultiplier: 0.65,
    statModifier: {
      stat: "defense",
      value: -3,
      durationTurns: 3
    },
    hpCost: null
  },
  aim: {
    id: "aim",
    name: "Aim",
    description: "Raises the user's Attack for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "attack",
      value: 3,
      durationTurns: 3
    },
    hpCost: null
  },
  evade: {
    id: "evade",
    name: "Evade",
    description: "Raises the user's Defense for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "defense",
      value: 3,
      durationTurns: 3
    },
    hpCost: null
  },
  heavy_chop: {
    id: "heavy_chop",
    name: "Heavy Chop",
    description: "Heavy physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 15,
    statMultiplier: 0.85,
    statModifier: null,
    hpCost: null
  },
  iron_stance: {
    id: "iron_stance",
    name: "Iron Stance",
    description: "Raises the user's Defense for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "defense",
      value: 4,
      durationTurns: 3
    },
    hpCost: null
  },
  axe_breaker: {
    id: "axe_breaker",
    name: "Axe Breaker",
    description: "Light damage and lowers the target's Attack.",
    type: "physical",
    effect: "damage_and_stat_modifier",
    target: "opponent",
    basePower: 8,
    statMultiplier: 0.65,
    statModifier: {
      stat: "attack",
      value: -3,
      durationTurns: 3
    },
    hpCost: null
  },
  holy_strike: {
    id: "holy_strike",
    name: "Holy Strike",
    description: "Reliable magic damage.",
    type: "magic",
    effect: "damage",
    target: "opponent",
    basePower: 10,
    statMultiplier: 0.75,
    statModifier: null,
    hpCost: null
  },
  divine_guard: {
    id: "divine_guard",
    name: "Divine Guard",
    description: "Raises the user's Defense for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "defense",
      value: 3,
      durationTurns: 3
    },
    hpCost: null
  },
  prayer: {
    id: "prayer",
    name: "Prayer",
    description: "Small heal that scales with Magic.",
    type: "magic",
    effect: "heal",
    target: "self",
    basePower: 11,
    statMultiplier: 0.55,
    statModifier: null,
    hpCost: null
  },
  lance_thrust: {
    id: "lance_thrust",
    name: "Lance Thrust",
    description: "Reliable physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 11,
    statMultiplier: 0.75,
    statModifier: null,
    hpCost: null
  },
  armor_pierce: {
    id: "armor_pierce",
    name: "Armor Pierce",
    description: "Light damage and lowers the target's Defense.",
    type: "physical",
    effect: "damage_and_stat_modifier",
    target: "opponent",
    basePower: 8,
    statMultiplier: 0.65,
    statModifier: {
      stat: "defense",
      value: -3,
      durationTurns: 3
    },
    hpCost: null
  },
  rally: {
    id: "rally",
    name: "Rally",
    description: "Raises the user's Attack for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "attack",
      value: 3,
      durationTurns: 3
    },
    hpCost: null
  },
  guard_break: {
    id: "guard_break",
    name: "Guard Break",
    description: "Light damage and lowers the target's Defense.",
    type: "physical",
    effect: "damage_and_stat_modifier",
    target: "opponent",
    basePower: 9,
    statMultiplier: 0.65,
    statModifier: {
      stat: "defense",
      value: -3,
      durationTurns: 3
    },
    hpCost: null
  },
  power_strike: {
    id: "power_strike",
    name: "Power Strike",
    description: "Heavy physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 15,
    statMultiplier: 0.85,
    statModifier: null,
    hpCost: null
  },
  clean_cut: {
    id: "clean_cut",
    name: "Clean Cut",
    description: "Reliable physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 11,
    statMultiplier: 0.75,
    statModifier: null,
    hpCost: null
  },
  blade_dance: {
    id: "blade_dance",
    name: "Blade Dance",
    description: "Raises the user's Attack for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "attack",
      value: 3,
      durationTurns: 3
    },
    hpCost: null
  },
  light_heal: {
    id: "light_heal",
    name: "Light Heal",
    description: "Small heal that scales with Magic.",
    type: "magic",
    effect: "heal",
    target: "self",
    basePower: 10,
    statMultiplier: 0.55,
    statModifier: null,
    hpCost: null
  },
  bless: {
    id: "bless",
    name: "Bless",
    description: "Raises the user's Magic for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "magic",
      value: 3,
      durationTurns: 3
    },
    hpCost: null
  },
  smite: {
    id: "smite",
    name: "Smite",
    description: "Reliable magic damage.",
    type: "magic",
    effect: "damage",
    target: "opponent",
    basePower: 11,
    statMultiplier: 0.75,
    statModifier: null,
    hpCost: null
  },
  weaken: {
    id: "weaken",
    name: "Weaken",
    description: "Lowers the target's Attack for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "opponent",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "attack",
      value: -3,
      durationTurns: 3
    },
    hpCost: null
  },
  rusty_blade: {
    id: "rusty_blade",
    name: "Rusty Blade",
    description: "Light physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 8,
    statMultiplier: 0.7,
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
    basePower: 7,
    statMultiplier: 0.6,
    statModifier: {
      stat: "defense",
      value: -2,
      durationTurns: 3
    },
    hpCost: null
  },
  frenzy: {
    id: "frenzy",
    name: "Frenzy",
    description: "Raises the user's Attack for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "attack",
      value: 3,
      durationTurns: 3
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
    basePower: 14,
    statMultiplier: 0.85,
    statModifier: null,
    hpCost: null
  },
  bite: {
    id: "bite",
    name: "Bite",
    description: "Reliable physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 10,
    statMultiplier: 0.75,
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
    basePower: 7,
    statMultiplier: 0.6,
    statModifier: {
      stat: "defense",
      value: -3,
      durationTurns: 3
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
    basePower: 14,
    statMultiplier: 0.85,
    statModifier: null,
    hpCost: null
  },
  skitter: {
    id: "skitter",
    name: "Skitter",
    description: "Raises the user's Defense for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "defense",
      value: 3,
      durationTurns: 3
    },
    hpCost: null
  },
  firebolt: {
    id: "firebolt",
    name: "Firebolt",
    description: "Reliable magic damage.",
    type: "magic",
    effect: "damage",
    target: "opponent",
    basePower: 11,
    statMultiplier: 0.75,
    statModifier: null,
    hpCost: null
  },
  arcane_surge: {
    id: "arcane_surge",
    name: "Arcane Surge",
    description: "Raises the user's Magic for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "magic",
      value: 3,
      durationTurns: 3
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
    basePower: 8,
    statMultiplier: 0.65,
    statModifier: {
      stat: "magic",
      value: -3,
      durationTurns: 3
    },
    hpCost: null
  },
  hex_shield: {
    id: "hex_shield",
    name: "Hex Shield",
    description: "Raises the user's Defense for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "defense",
      value: 3,
      durationTurns: 3
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
    basePower: 16,
    statMultiplier: 0.85,
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
    basePower: 7,
    statMultiplier: 0.55,
    statModifier: null,
    hpCost: null
  },
  curse: {
    id: "curse",
    name: "Curse",
    description: "Lowers the target's Attack for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "opponent",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "attack",
      value: -3,
      durationTurns: 3
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
      value: 5,
      durationTurns: 3
    },
    hpCost: 10
  },
  flame_breath: {
    id: "flame_breath",
    name: "Flame Breath",
    description: "Very heavy magic damage.",
    type: "magic",
    effect: "damage",
    target: "opponent",
    basePower: 21,
    statMultiplier: 0.95,
    statModifier: null,
    hpCost: null
  },
  claw_swipe: {
    id: "claw_swipe",
    name: "Claw Swipe",
    description: "Reliable physical damage.",
    type: "physical",
    effect: "damage",
    target: "opponent",
    basePower: 13,
    statMultiplier: 0.8,
    statModifier: null,
    hpCost: null
  },
  intimidate: {
    id: "intimidate",
    name: "Intimidate",
    description: "Lowers the target's Attack for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "opponent",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "attack",
      value: -4,
      durationTurns: 3
    },
    hpCost: null
  },
  dragon_scales: {
    id: "dragon_scales",
    name: "Dragon Scales",
    description: "Raises the user's Defense for three turns.",
    type: "status",
    effect: "stat_modifier",
    target: "self",
    basePower: 0,
    statMultiplier: 0,
    statModifier: {
      stat: "defense",
      value: 5,
      durationTurns: 3
    },
    hpCost: null
  }
});

export const itemRegistry: ItemRegistry = createItemRegistry({
  leather_helmet: {
    id: "leather_helmet",
    name: "Leather Helmet",
    description: "Raises the user's Defense while equipped.",
    target: "self",
    statModifier: {
      stat: "defense",
      value: 2
    }
  },
  iron_helmet: {
    id: "iron_helmet",
    name: "Iron Helmet",
    description: "Raises the user's Defense while equipped.",
    target: "self",
    statModifier: {
      stat: "defense",
      value: 3
    }
  },
  chain_armor: {
    id: "chain_armor",
    name: "Chain Armor",
    description: "Raises the user's max Health while equipped.",
    target: "self",
    statModifier: {
      stat: "health",
      value: 15
    }
  },
  plate_armor: {
    id: "plate_armor",
    name: "Plate Armor",
    description: "Greatly raises the user's max Health while equipped.",
    target: "self",
    statModifier: {
      stat: "health",
      value: 25
    }
  },
  iron_blade: {
    id: "iron_blade",
    name: "Iron Blade",
    description: "Raises the user's Attack while equipped.",
    target: "self",
    statModifier: {
      stat: "attack",
      value: 3
    }
  },
  steel_sword: {
    id: "steel_sword",
    name: "Steel Sword",
    description: "Raises the user's Attack while equipped.",
    target: "self",
    statModifier: {
      stat: "attack",
      value: 5
    }
  },
  hunter_bow: {
    id: "hunter_bow",
    name: "Hunter Bow",
    description: "Raises the user's Attack while equipped.",
    target: "self",
    statModifier: {
      stat: "attack",
      value: 3
    }
  },
  priest_charm: {
    id: "priest_charm",
    name: "Priest Charm",
    description: "Raises the user's Magic while equipped.",
    target: "self",
    statModifier: {
      stat: "magic",
      value: 3
    }
  },
  mana_relic: {
    id: "mana_relic",
    name: "Mana Relic",
    description: "Raises the user's Magic while equipped.",
    target: "self",
    statModifier: {
      stat: "magic",
      value: 5
    }
  },
  tower_bulwark: {
    id: "tower_bulwark",
    name: "Tower Bulwark",
    description: "Raises the user's Defense while equipped.",
    target: "self",
    statModifier: {
      stat: "defense",
      value: 4
    }
  },
  field_tonic: {
    id: "field_tonic",
    name: "Field Tonic",
    description: "Raises the user's max Health while equipped.",
    target: "self",
    statModifier: {
      stat: "health",
      value: 12
    }
  },
  war_drum: {
    id: "war_drum",
    name: "War Drum",
    description: "Raises the user's Attack while equipped.",
    target: "self",
    statModifier: {
      stat: "attack",
      value: 4
    }
  },
  cracked_totem: {
    id: "cracked_totem",
    name: "Cracked Totem",
    description: "Lowers the target's Defense while equipped.",
    target: "opponent",
    statModifier: {
      stat: "defense",
      value: -2
    }
  },
  witch_lantern: {
    id: "witch_lantern",
    name: "Witch Lantern",
    description: "Lowers the target's Magic while equipped.",
    target: "opponent",
    statModifier: {
      stat: "magic",
      value: -3
    }
  },
  dragon_scale_relic: {
    id: "dragon_scale_relic",
    name: "Dragon Scale Relic",
    description: "Greatly raises the user's Defense while equipped.",
    target: "self",
    statModifier: {
      stat: "defense",
      value: 6
    }
  }
});

export const environmentRegistry: EnvironmentRegistry = createEnvironmentRegistry({
  forest: {
    id: "forest",
    name: "Forest",
    description: "A quiet stretch of wild land with no special effect on either side.",
    heroEffects: {
      statModifiers: {},
      turnEffect: null
    },
    monsterEffects: {
      statModifiers: {},
      turnEffect: null
    }
  },
  spider: {
    id: "spider",
    name: "Spider Nest",
    description: "Sticky webs slightly lower the hero's Defense.",
    heroEffects: {
      statModifiers: {
        defense: -1
      },
      turnEffect: null
    },
    monsterEffects: {
      statModifiers: {},
      turnEffect: null
    }
  },
  lava: {
    id: "lava",
    name: "Lava Chamber",
    description: "Scorching ground burns the hero at the end of each turn.",
    heroEffects: {
      statModifiers: {},
      turnEffect: {
        type: "damage",
        value: 3
      }
    },
    monsterEffects: {
      statModifiers: {},
      turnEffect: null
    }
  },
  magic: {
    id: "magic",
    name: "Magic Hall",
    description: "Loose mana empowers spells for both combatants.",
    heroEffects: {
      statModifiers: {
        magic: 3
      },
      turnEffect: null
    },
    monsterEffects: {
      statModifiers: {
        magic: 3
      },
      turnEffect: null
    }
  },
  dragon: {
    id: "dragon",
    name: "Dragon Throne",
    description: "Oppressive draconic pressure slowly lowers the hero's Attack.",
    heroEffects: {
      statModifiers: {},
      turnEffect: {
        type: "stat_modifier",
        stat: "attack",
        value: -1
      }
    },
    monsterEffects: {
      statModifiers: {},
      turnEffect: null
    }
  }
});

export const heroes: HeroDefaults[] = [
  {
    id: "knight",
    name: "Knight",
    description: "A balanced frontline fighter with defense and self-sustain.",
    spriteKey: "knight",
    baseStats: createStats(100, 12, 10, 9),
    statsPerLevel: createStats(7, 1, 1, 1),
    moves: ["slash", "shield_up", "battle_cry", "second_wind"],
    equippedItems: [],
    inventoryItems: ["leather_helmet"]
  },
  {
    id: "archer",
    name: "Archer",
    description: "A precise fighter with good damage, but weaker Defense.",
    spriteKey: "archer",
    baseStats: createStats(98, 14, 7, 8),
    statsPerLevel: createStats(6, 2, 1, 1),
    moves: ["quick_shot", "piercing_arrow", "aim", "basic_heal"],
    equippedItems: [],
    inventoryItems: ["hunter_bow"]
  },
  {
    id: "armored_axeman",
    name: "Armored Axeman",
    description: "A sturdy fighter with strong Defense and slower damage scaling.",
    spriteKey: "armored_axeman",
    baseStats: createStats(105, 13, 12, 5),
    statsPerLevel: createStats(8, 1, 2, 1),
    moves: ["heavy_chop", "iron_stance", "axe_breaker", "second_wind"],
    equippedItems: [],
    inventoryItems: ["iron_helmet"]
  },
  {
    id: "knight_templar",
    name: "Knight Templar",
    description: "A defensive holy fighter with healing and magic utility.",
    spriteKey: "knight_templar",
    baseStats: createStats(102, 10, 11, 13),
    statsPerLevel: createStats(7, 1, 1, 2),
    moves: ["holy_strike", "divine_guard", "prayer", "shield_up"],
    equippedItems: [],
    inventoryItems: ["priest_charm"]
  },
  {
    id: "lancer",
    name: "Lancer",
    description: "A focused fighter that breaks armor before dealing damage.",
    spriteKey: "lancer",
    baseStats: createStats(100, 13, 9, 8),
    statsPerLevel: createStats(7, 2, 1, 1),
    moves: ["lance_thrust", "armor_pierce", "rally", "basic_heal"],
    equippedItems: [],
    inventoryItems: ["iron_blade"]
  },
  {
    id: "soldier",
    name: "Soldier",
    description: "A simple and reliable fighter with no major weakness.",
    spriteKey: "soldier",
    baseStats: createStats(100, 12, 10, 8),
    statsPerLevel: createStats(7, 1, 1, 1),
    moves: ["slash", "shield_up", "power_strike", "basic_heal"],
    equippedItems: [],
    inventoryItems: ["leather_helmet"]
  },
  {
    id: "swordsman",
    name: "Swordsman",
    description: "A physical attacker with good damage and lower Defense.",
    spriteKey: "swordsman",
    baseStats: createStats(98, 14, 8, 7),
    statsPerLevel: createStats(6, 2, 1, 1),
    moves: ["clean_cut", "blade_dance", "power_strike", "basic_heal"],
    equippedItems: [],
    inventoryItems: ["iron_blade"]
  },
  {
    id: "priest",
    name: "Priest",
    description: "A magic support class with healing, buffs and holy damage.",
    spriteKey: "priest",
    baseStats: createStats(100, 8, 8, 15),
    statsPerLevel: createStats(7, 1, 1, 2),
    moves: ["smite", "light_heal", "bless", "weaken"],
    equippedItems: [],
    inventoryItems: ["priest_charm"]
  }
];

export const encounters: Monster[] = [
  {
    id: "goblin_warrior",
    name: "Goblin Warrior",
    description: "A weak but annoying fighter who uses cheap tricks.",
    environmentId: "forest",
    stats: createStats(100, 10, 6, 3),
    moves: ["rusty_blade", "dirty_kick", "headbutt", "goblin_patch"],
    equippedItems: [],
    inventoryItems: ["leather_helmet"],
    learnableMoves: ["rusty_blade", "dirty_kick", "headbutt", "goblin_patch"],
    xpReward: 80,
    coinReward: 40,
    spriteKey: "orc"
  },
  {
    id: "giant_spider",
    name: "Giant Spider",
    description: "A patient hunter that weakens armor before going for the kill.",
    environmentId: "spider",
    stats: createStats(120, 12, 8, 4),
    moves: ["bite", "web_throw", "pounce", "cocoon_rest"],
    equippedItems: [],
    inventoryItems: ["field_tonic"],
    learnableMoves: ["bite", "web_throw", "pounce", "cocoon_rest"],
    xpReward: 115,
    coinReward: 60,
    spriteKey: "orc_rider"
  },
  {
    id: "goblin_mage",
    name: "Goblin Mage",
    description: "A dangerous caster that becomes stronger if ignored.",
    environmentId: "lava",
    stats: createStats(165, 7, 7, 14),
    moves: ["firebolt", "arcane_surge", "mana_drain", "dark_mend"],
    equippedItems: [],
    inventoryItems: ["priest_charm"],
    learnableMoves: ["firebolt", "arcane_surge", "mana_drain", "dark_mend"],
    xpReward: 150,
    coinReward: 80,
    spriteKey: "armored_orc"
  },
  {
    id: "witch",
    name: "Witch",
    description: "A cursed magic user who survives through drain and curses.",
    environmentId: "magic",
    stats: createStats(195, 8, 9, 17),
    moves: ["shadow_bolt", "drain_life", "curse", "witch_brew"],
    equippedItems: [],
    inventoryItems: ["witch_lantern"],
    learnableMoves: ["shadow_bolt", "drain_life", "curse", "witch_brew"],
    xpReward: 195,
    coinReward: 110,
    spriteKey: "wizard"
  },
  {
    id: "dragon",
    name: "Dragon",
    description: "The final guardian of the tower. It may take several runs to defeat.",
    environmentId: "dragon",
    stats: createStats(285, 16, 13, 18),
    moves: ["flame_breath", "claw_swipe", "intimidate", "dragon_regen"],
    equippedItems: [],
    inventoryItems: ["dragon_scale_relic", "plate_armor"],
    learnableMoves: ["flame_breath", "claw_swipe", "intimidate", "dragon_regen"],
    xpReward: 300,
    coinReward: 185,
    spriteKey: "werebear"
  }
];

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

function createItemShopItem(
  id: string,
  name: string,
  description: string,
  cost: number,
  itemId: string
) {
  const item = itemRegistry[itemId];

  if (!item) {
    throw new Error(`unknown_item_shop_item:${itemId}`);
  }

  return {
    id,
    name,
    description,
    spriteKey: item.spriteKey,
    cost,
    repeatable: false as const,
    type: "item" as const,
    itemId
  };
}

export const shopItems: ShopItem[] = [
  createStatShopItem(
    "health_tonic",
    "Health Tonic",
    "Permanently increases max Health.",
    "health",
    85,
    "health",
    10
  ),
  createStatShopItem(
    "attack_training",
    "Attack Training",
    "Permanently increases Attack.",
    "attack",
    95,
    "attack",
    1
  ),
  createStatShopItem(
    "defense_training",
    "Defense Training",
    "Permanently increases Defense.",
    "defense",
    95,
    "defense",
    1
  ),
  createStatShopItem(
    "magic_training",
    "Magic Training",
    "Permanently increases Magic.",
    "magic",
    95,
    "magic",
    1
  ),
  createMoveShopItem(
    "buy_power_strike",
    "Power Strike Manual",
    "Unlocks Power Strike for the hero.",
    125,
    "power_strike"
  ),
  createMoveShopItem(
    "buy_firebolt",
    "Firebolt Tome",
    "Unlocks Firebolt for the hero.",
    130,
    "firebolt"
  ),
  createMoveShopItem(
    "buy_hex_shield",
    "Hex Shield Sigil",
    "Unlocks Hex Shield for the hero.",
    145,
    "hex_shield"
  ),
  createMoveShopItem(
    "buy_drain_life",
    "Drain Life Grimoire",
    "Unlocks Drain Life for the hero.",
    160,
    "drain_life"
  ),
  createMoveShopItem(
    "buy_shadow_bolt",
    "Shadow Bolt Tome",
    "Unlocks Shadow Bolt for the hero.",
    180,
    "shadow_bolt"
  ),
  createItemShopItem(
    "buy_iron_helmet",
    "Iron Helmet",
    "Adds an Iron Helmet to the hero's inventory.",
    80,
    "iron_helmet"
  ),
  createItemShopItem(
    "buy_chain_armor",
    "Chain Armor",
    "Adds Chain Armor to the hero's inventory.",
    100,
    "chain_armor"
  ),
  createItemShopItem(
    "buy_iron_blade",
    "Iron Blade",
    "Adds Iron Blade to the hero's inventory.",
    105,
    "iron_blade"
  ),
  createItemShopItem(
    "buy_steel_sword",
    "Steel Sword",
    "Adds Steel Sword to the hero's inventory.",
    150,
    "steel_sword"
  ),
  createItemShopItem(
    "buy_mana_relic",
    "Mana Relic",
    "Adds Mana Relic to the hero's inventory.",
    150,
    "mana_relic"
  ),
  createItemShopItem(
    "buy_plate_armor",
    "Plate Armor",
    "Adds Plate Armor to the hero's inventory.",
    170,
    "plate_armor"
  )
];

export function getMove(moveId: string): Move | undefined {
  return moveRegistry[moveId];
}

export function getItem(itemId: string): Item | undefined {
  return itemRegistry[itemId];
}

export function getEnvironment(environmentId: string): Environment | undefined {
  return environmentRegistry[environmentId];
}
