# Client Integration Guide

This server is stateless and simple:

- `GET /run/config` gives the client all static game data needed for a run
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
      "learnableMoves": ["rusty_blade", "dirty_kick", "frenzy", "headbutt"],
      "xpReward": 80,
      "spriteKey": "goblin_warrior"
    }
  ],
  "heroDefaults": {
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
    "moves": ["slash", "shield_up", "battle_cry", "second_wind"]
  },
  "xpTable": [0, 100, 250, 450, 700],
  "moveRegistry": {
    "slash": {
      "id": "slash",
      "name": "Slash",
      "description": "Moderate physical damage.",
      "type": "physical",
      "effect": "damage",
      "target": "opponent",
      "basePower": 15,
      "statMultiplier": 1,
      "statModifier": null,
      "hpCost": null
    }
  }
}
```

#### What the client should do with it

- store `runId` if you want a run identifier on the client
- use `encounters` as the battle order
- initialize the hero from `heroDefaults`
- use `xpTable` for level-up thresholds
- use `moveRegistry[moveId]` whenever you need full move details in battle UI, tooltips, or resolution logic

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

### `Monster`

```ts
type Monster = {
  id: string;
  name: string;
  description: string;
  stats: Stats;
  moves: string[];
  learnableMoves: string[];
  xpReward: number;
  spriteKey: string;
};
```

### `RunConfig`

```ts
type RunConfig = {
  runId: string;
  encounters: Monster[];
  heroDefaults: {
    baseStats: Stats;
    statsPerLevel: Stats;
    moves: string[];
  };
  xpTable: number[];
  moveRegistry: Record<string, Move>;
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

- resolve damage, healing, drain, and stat modifiers locally
- track current HP for both sides
- track temporary buffs/debuffs and remove them after `durationTurns`
- award `xpReward` after a win
- apply level-ups using `xpTable` and `heroDefaults.statsPerLevel`
- pick one move from `learnableMoves` after each victory if that is part of your flow
- keep the equipped move list to a max of 4 moves

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
