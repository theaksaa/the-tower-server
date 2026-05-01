# Client Integration Guide

This server is stateless and simple:

- `GET /run/config` gives the client all static game data needed for a run
- `POST /run/next-encounter` gives the client the next server-generated endless encounter
- `GET /battle/monster-move` or `POST /battle/monster-move` gives the monster's move for the current turn
- the client is responsible for rendering, local battle resolution, XP progression, learned moves, and temporary stat effects

Base URL during local development:

```txt
http://localhost:3000
```

## Endpoints

### `GET /run/config`

Call this once when starting a new run.

#### Request

```http
GET /run/config
```

No params, no body.

#### Response

```json
{
  "runId": "84267152-aa3c-43f9-a789-dd229939fa47",
  "encounters": [
    {
      "id": "goblin_warrior",
      "name": "Goblin Warrior",
      "description": "A scrappy fighter who wins through cheap shots and reckless aggression.",
      "stats": {
        "health": 70,
        "attack": 15,
        "defense": 7,
        "magic": 4
      },
      "moves": ["rusty_blade", "dirty_kick", "frenzy", "headbutt"],
      "equippedItems": ["cracked_totem"],
      "inventoryItems": [],
      "learnableMoves": ["rusty_blade", "dirty_kick", "frenzy", "headbutt"],
      "xpReward": 80,
      "coinReward": 40,
      "spriteKey": "goblin_warrior"
    }
  ],
  "heroes": [
    {
      "id": "knight",
      "name": "Knight",
      "description": "A durable frontline fighter with steady offense and self-sustain.",
      "spriteKey": "hero_knight",
      "baseStats": {
        "health": 120,
        "attack": 18,
        "defense": 10,
        "magic": 12
      },
      "statsPerLevel": {
        "health": 18,
        "attack": 4,
        "defense": 3,
        "magic": 3
      },
      "moves": ["slash", "shield_up", "battle_cry", "second_wind"],
      "equippedItems": ["iron_blade", "tower_bulwark"],
      "inventoryItems": ["field_tonic"]
    },
    {
      "id": "berserker",
      "name": "Berserker",
      "description": "An aggressive bruiser with bigger physical scaling and lighter defenses.",
      "spriteKey": "hero_berserker",
      "baseStats": {
        "health": 132,
        "attack": 22,
        "defense": 7,
        "magic": 8
      },
      "statsPerLevel": {
        "health": 20,
        "attack": 5,
        "defense": 2,
        "magic": 2
      },
      "moves": ["slash", "battle_cry", "headbutt", "second_wind"],
      "equippedItems": ["war_drum", "spiked_band"],
      "inventoryItems": []
    },
    {
      "id": "spellblade",
      "name": "Spellblade",
      "description": "A hybrid duelist that mixes weapon strikes with flexible magic utility.",
      "spriteKey": "hero_spellblade",
      "baseStats": {
        "health": 108,
        "attack": 15,
        "defense": 9,
        "magic": 18
      },
      "statsPerLevel": {
        "health": 16,
        "attack": 3,
        "defense": 2,
        "magic": 4
      },
      "moves": ["slash", "firebolt", "arcane_surge", "second_wind"],
      "equippedItems": ["ember_charm", "warding_orb"],
      "inventoryItems": ["field_tonic"]
    }
  ],
  "levelProgression": {
    "baseXpForNextLevel": 100,
    "additionalXpPerLevel": 50
  },
  "endlessMode": {
    "enabled": true,
    "encountersPerLoop": 5,
    "healthMultiplierPerLoop": 1.2,
    "statMultiplierPerLoop": 1.12,
    "rewardMultiplierPerLoop": 1.15
  },
  "xpRewardScaling": {
    "multiplierPerKill": 0.95,
    "minimumReward": 25
  },
  "coinRewardScaling": {
    "multiplierPerKill": 0.9,
    "minimumReward": 5
  },
  "shopItems": [
    {
      "id": "health_tonic",
      "name": "Health Tonic",
      "description": "Permanently increases max Health.",
      "spriteKey": "health_tonic",
      "cost": 35,
      "repeatable": true,
      "type": "stat",
      "stat": "health",
      "value": 20
    },
    {
      "id": "buy_firebolt",
      "name": "Firebolt Tome",
      "description": "Unlocks Firebolt for the hero.",
      "spriteKey": "firebolt",
      "cost": 55,
      "repeatable": false,
      "type": "move",
      "moveId": "firebolt"
    }
  ],
  "moveRegistry": {
    "slash": {
      "id": "slash",
      "name": "Slash",
      "description": "Moderate physical damage.",
      "spriteKey": "slash",
      "type": "physical",
      "effect": "damage",
      "target": "opponent",
      "basePower": 15,
      "statMultiplier": 1,
      "statModifier": null,
      "hpCost": null
    }
  },
  "itemRegistry": {
    "iron_blade": {
      "id": "iron_blade",
      "name": "Iron Blade",
      "description": "Lowers the target's Defense while equipped.",
      "spriteKey": "iron_blade",
      "target": "opponent",
      "statModifier": {
        "stat": "defense",
        "value": -5
      }
    }
  }
}
```

#### What the client should do with it

- store `runId` if you want a run identifier on the client
- use `encounters` as the battle order
- let the player pick one entry from `heroes`
- initialize the hero from the selected hero's `baseStats` and `moves`
- initialize the hero's equipped and inventory items from `equippedItems` and `inventoryItems`
- use `hero.spriteKey` and `move.spriteKey` to resolve art/icons in the client
- use `item.spriteKey` to resolve item art/icons in the client
- use `levelProgression` to calculate how much XP is needed for each next level with no max level cap
- if `endlessMode.enabled` is `true`, call `POST /run/next-encounter` whenever you need the next endless battle
- use `xpRewardScaling` with each monster's `xpReward` to calculate how much XP a kill gives as the run goes on
- use `coinRewardScaling` with each monster's `coinReward` to calculate how much gold a kill gives as the run goes on
- use `shopItems` to render the shop and apply permanent stat boosts or move unlocks
- for move shop entries, read full move data from `moveRegistry[shopItem.moveId]`
- respect `repeatable` so one-time purchases cannot be bought again
- use `moveRegistry[moveId]` whenever you need full move details in battle UI, tooltips, or resolution logic
- use `itemRegistry[itemId]` whenever you need full item details in battle UI, tooltips, equipment, inventory, or drops
- treat items as losable inventory/equipment objects: when a monster dies, drop its items; when the hero dies, remove the hero's items

### `POST /run/next-encounter`

Call this when you want the server to generate the next endless-mode encounter.

#### Request

```http
POST /run/next-encounter
Content-Type: application/json
```

```json
{
  "encountersCleared": 5
}
```

- `encountersCleared` is the number of battles the player has already won in the current run
- with the current config, `0-4` maps to the first loop and `5-9` maps to the second loop

#### Response

```json
{
  "encounterNumber": 6,
  "loopNumber": 2,
  "baseMonsterId": "goblin_warrior",
  "monster": {
    "id": "goblin_warrior_endless_2",
    "name": "Goblin Warrior +1",
    "description": "A scrappy fighter who wins through cheap shots and reckless aggression. Empowered by endless ascent.",
    "stats": {
      "health": 84,
      "attack": 17,
      "defense": 8,
      "magic": 4
    },
    "moves": ["rusty_blade", "dirty_kick", "frenzy", "headbutt"],
    "equippedItems": ["cracked_totem"],
    "inventoryItems": [],
    "learnableMoves": ["rusty_blade", "dirty_kick", "frenzy", "headbutt"],
    "xpReward": 92,
    "coinReward": 46,
    "spriteKey": "orc"
  }
}
```

- `encounterNumber` is 1-indexed across the entire endless run
- `loopNumber` is 1 for the first pass through the roster, 2 for the second, and so on
- `baseMonsterId` identifies which original roster monster was used as the template
- `monster` is the fully scaled encounter to render and reward from

### `GET /battle/monster-move`

Call this once per monster turn after the hero acts.

#### Request

Send battle state as a URL-encoded JSON string in the `state` query param:

```http
GET /battle/monster-move?state=<url-encoded-json>
```

#### Battle state shape

```json
{
  "monsterId": "dragon",
  "monsterCurrentHp": 170,
  "heroCurrentHp": 72,
  "heroMaxHp": 180,
  "heroStats": {
    "health": 180,
    "attack": 28,
    "defense": 18,
    "magic": 20
  },
  "turnNumber": 4,
  "heroLastMoveId": "slash",
  "monsterMoveHistory": ["flame_breath", "dragon_scales", "claw_swipe"]
}
```

#### Response

```json
{
  "moveId": "claw_swipe",
  "move": {
    "id": "claw_swipe",
    "name": "Claw Swipe",
    "description": "Moderate physical damage.",
    "spriteKey": "claw_swipe",
    "type": "physical",
    "effect": "damage",
    "target": "opponent",
    "basePower": 18,
    "statMultiplier": 1,
    "statModifier": null,
    "hpCost": null
  }
}
```

### `POST /battle/monster-move`

Same behavior as `GET`, but send the battle state as JSON in the body.

#### Request

```http
POST /battle/monster-move
Content-Type: application/json
```

```json
{
  "monsterId": "dragon",
  "monsterCurrentHp": 170,
  "heroCurrentHp": 72,
  "heroMaxHp": 180,
  "heroStats": {
    "health": 180,
    "attack": 28,
    "defense": 18,
    "magic": 20
  },
  "turnNumber": 4,
  "heroLastMoveId": "slash",
  "monsterMoveHistory": ["flame_breath", "dragon_scales", "claw_swipe"]
}
```

#### Response

Same as the `GET` version.

## Data Models

### `Stats`

```ts
type Stats = {
  health: number;
  attack: number;
  defense: number;
  magic: number;
};
```

### `StatModifier`

```ts
type StatModifier = {
  stat: "attack" | "defense" | "magic";
  value: number;
  durationTurns: number;
};
```

- positive `value` = buff
- negative `value` = debuff

### `Move`

```ts
type Move = {
  id: string;
  name: string;
  description: string;
  spriteKey: string;
  type: "physical" | "magic" | "status";
  effect:
    | "damage"
    | "heal"
    | "drain"
    | "stat_modifier"
    | "damage_and_stat_modifier";
  target: "self" | "opponent";
  basePower: number;
  statMultiplier: number;
  statModifier: StatModifier | null;
  hpCost: number | null;
};
```

### `Item`

```ts
type Item = {
  id: string;
  name: string;
  description: string;
  spriteKey: string;
  target: "self" | "opponent";
  statModifier: {
    stat: "health" | "attack" | "defense" | "magic";
    value: number;
  };
};
```

- items do not deal damage, heal, or drain
- items only apply a buff or debuff to `self` or `opponent`
- item effects stay active for the whole battle while the item is equipped
- items can also modify `health`, which the client should treat as max Health
- items are losable because they live in equipment/inventory, not in the learned move pool

### `Monster`

```ts
type Monster = {
  id: string;
  name: string;
  description: string;
  stats: Stats;
  moves: string[];
  equippedItems: string[];
  inventoryItems: string[];
  learnableMoves: string[];
  xpReward: number;
  coinReward: number;
  spriteKey: string;
};
```

- monsters can have up to 4 equipped items at a time
- if the monster dies, the client can drop both `equippedItems` and `inventoryItems`

### `CoinRewardScaling`

```ts
type CoinRewardScaling = {
  multiplierPerKill: number;
  minimumReward: number;
};
```

### `XpRewardScaling`

```ts
type XpRewardScaling = {
  multiplierPerKill: number;
  minimumReward: number;
};
```

### `LevelProgression`

```ts
type LevelProgression = {
  baseXpForNextLevel: number;
  additionalXpPerLevel: number;
};
```

- XP needed to go from level `N` to level `N + 1`:
  `baseXpForNextLevel + (N - 1) * additionalXpPerLevel`
- with the current config, the next-level costs are `100, 150, 200, 250, 300...`

### `EndlessModeConfig`

```ts
type EndlessModeConfig = {
  enabled: boolean;
  encountersPerLoop: number;
  healthMultiplierPerLoop: number;
  statMultiplierPerLoop: number;
  rewardMultiplierPerLoop: number;
};
```

- `encountersPerLoop` should match the base roster size used by the server for endless rotation
- at the start of each new loop, the server multiplies monster `health`, `attack`, `defense`, and `magic`
- XP and coin rewards are also scaled upward by the server before the client applies its usual per-kill reward decay

### `HeroDefaults`

```ts
type HeroDefaults = {
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
```

- heroes can have up to 4 equipped items at a time
- `equippedItems` are ready for battle and `inventoryItems` are owned but unequipped

### `ShopItem`

```ts
type ShopItem =
  | {
      id: string;
      name: string;
      description: string;
      spriteKey: string;
      cost: number;
      repeatable: true;
      type: "stat";
      stat: "health" | "attack" | "defense" | "magic";
      value: number;
    }
  | {
      id: string;
      name: string;
      description: string;
      spriteKey: string;
      cost: number;
      repeatable: false;
      type: "move";
      moveId: string;
    };
```

- stat items can be purchased multiple times when `repeatable` is `true`
- move items are one-time unlocks and always use a `moveId` that exists in `moveRegistry`

### `RunConfig`

```ts
type RunConfig = {
  runId: string;
  encounters: Monster[];
  heroes: HeroDefaults[];
  levelProgression: LevelProgression;
  endlessMode: EndlessModeConfig;
  xpRewardScaling: XpRewardScaling;
  coinRewardScaling: CoinRewardScaling;
  shopItems: ShopItem[];
  moveRegistry: Record<string, Move>;
  itemRegistry: Record<string, Item>;
};
```

### `BattleState`

```ts
type BattleState = {
  monsterId: string;
  monsterCurrentHp: number;
  heroCurrentHp: number;
  heroMaxHp: number;
  heroStats: Stats;
  turnNumber: number;
  heroLastMoveId: string | null;
  monsterMoveHistory: string[];
};
```

## Client Responsibilities

The server does not calculate final battle results. The client should:

- resolve move damage, move healing, move drain, and all stat modifiers locally
- track current HP for both sides
- track temporary buffs/debuffs and remove them after `durationTurns`
- award XP after a win with a formula like `Math.max(minimumReward, Math.round(monster.xpReward * multiplierPerKill ** monstersKilledSoFar))`
- award coins after a win with a formula like `Math.max(minimumReward, Math.round(monster.coinReward * multiplierPerKill ** monstersKilledSoFar))`
- store which hero was selected for the run
- apply level-ups using `levelProgression` and the selected hero's `statsPerLevel`
- apply purchased stat items permanently to the hero's tracked stats
- prevent re-buying any `shopItems` where `repeatable` is `false`
- for move purchases, unlock the referenced `moveId` from `moveRegistry`
- pick one move from `learnableMoves` after each victory if that is part of your flow
- keep the equipped move list to a max of 4 moves
- keep the equipped item list to a max of 4 items
- track hero inventory separately from equipped items
- apply item effects only as buffs/debuffs to `self` or `opponent`
- keep equipped item effects active for the whole battle instead of expiring after turns
- when an equipped item modifies `health`, apply it as a max-Health bonus while equipped
- when a monster dies, grant or drop its `equippedItems` and `inventoryItems` based on your loot flow
- when the hero dies, remove the hero's equipped and inventory items because items are losable
- when using endless mode, request the next encounter from the server instead of generating or scaling monsters locally

## Error Responses

All errors use this shape:

```json
{
  "error": "error_code",
  "message": "Human-readable description"
}
```

### Expected errors

- `400 invalid_battle_state`
  - missing `state`
  - invalid JSON
  - missing required fields
  - wrong field types
- `400 invalid_next_encounter_request`
  - missing `encountersCleared`
  - negative `encountersCleared`
  - non-integer `encountersCleared`
- `404 monster_not_found`
  - `monsterId` does not match any configured encounter
- `500 server_error`
  - unexpected server problem

## Example Client Snippets

### Fetch run config

```ts
const response = await fetch("http://localhost:3000/run/config");
const runConfig = await response.json();
```

### Fetch monster move with `GET`

```ts
const battleState = {
  monsterId: "dragon",
  monsterCurrentHp: 170,
  heroCurrentHp: 72,
  heroMaxHp: 180,
  heroStats: {
    health: 180,
    attack: 28,
    defense: 18,
    magic: 20
  },
  turnNumber: 4,
  heroLastMoveId: "slash",
  monsterMoveHistory: ["flame_breath", "dragon_scales", "claw_swipe"]
};

const encoded = encodeURIComponent(JSON.stringify(battleState));
const response = await fetch(
  `http://localhost:3000/battle/monster-move?state=${encoded}`
);
const monsterMove = await response.json();
```

### Fetch monster move with `POST`

```ts
const response = await fetch("http://localhost:3000/battle/monster-move", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(battleState)
});

const monsterMove = await response.json();
```
