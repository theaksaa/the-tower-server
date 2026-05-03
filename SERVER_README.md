# Server Reference

This document explains how the server works today and replaces the old client integration document.

## Overview

The server is stateless and config-driven:

- static game content comes from `src/engine/config.json`
- `GET /run/config` returns the full data the client needs to start a run
- `POST /run/next-encounter` generates endless-mode encounters from base monsters
- `GET /battle/monster-move` and `POST /battle/monster-move` choose the monster's next move

The server does not manage rendering, animations, save state, or a persistent run session. It gives the client authoritative content plus monster decisions.

## Startup flow

Server startup is defined in [src/index.ts](/c:/Users/aksaa/Documents/Projects/the-tower-server/src/index.ts), [src/app.ts](/c:/Users/aksaa/Documents/Projects/the-tower-server/src/app.ts), and [src/config/env.ts](/c:/Users/aksaa/Documents/Projects/the-tower-server/src/config/env.ts).

Flow:

1. Environment variables are loaded with `dotenv`.
2. `zod` validates `NODE_ENV`, `PORT`, and optional HTTPS settings.
3. If `HTTPS_ENABLED=true`, the server reads the certificate and key files.
4. Fastify registers the health, run, and battle routes.
5. The app listens on `0.0.0.0:<PORT>`.

## Config source of truth

The content file is [src/engine/config.json](/c:/Users/aksaa/Documents/Projects/the-tower-server/src/engine/config.json).

Loading and validation live in [src/engine/config.ts](/c:/Users/aksaa/Documents/Projects/the-tower-server/src/engine/config.ts).

At startup, the server:

- imports the JSON file
- normalizes missing `spriteKey` values for moves, items, and environments
- verifies registry keys match each object's `id`
- verifies hero, encounter, and shop IDs are unique
- verifies every referenced move, item, and environment exists

If config references are broken, the server fails on startup instead of serving invalid data.

## Routes

### `GET /health`

Returns:

```json
{ "ok": true }
```

Use it for local checks or deployment probes.

### `GET /run/config`

Implemented in [src/api/routes/run.routes.ts](/c:/Users/aksaa/Documents/Projects/the-tower-server/src/api/routes/run.routes.ts).

Returns a full `RunConfig` payload built by [src/engine/gameEngine.ts](/c:/Users/aksaa/Documents/Projects/the-tower-server/src/engine/gameEngine.ts).

Response shape:

```json
{
  "runId": "generated-id",
  "encounters": [],
  "heroes": [],
  "levelProgression": {},
  "endlessMode": {},
  "xpRewardScaling": {},
  "coinRewardScaling": {},
  "shopItems": [],
  "moveRegistry": {},
  "itemRegistry": {},
  "environmentRegistry": {}
}
```

Important behavior:

- `runId` is generated per response
- encounter order is taken directly from `config.json`
- all heroes are returned at once for client-side selection
- all move, item, and environment registries are returned so the client can resolve details without extra requests

### `POST /run/next-encounter`

Request body:

```json
{
  "encountersCleared": 5
}
```

Response shape:

```json
{
  "encounterNumber": 6,
  "loopNumber": 2,
  "baseMonsterId": "goblin_warrior",
  "monster": {}
}
```

Behavior:

- `encounterNumber` is `encountersCleared + 1`
- loop size comes from `endlessMode.encountersPerLoop`
- loop 1 uses the base encounter order
- later loops use a deterministic shuffle based on loop index
- returned monster stats and rewards are scaled from the base monster
- endless monsters use IDs like `dragon_endless_3`

Validation:

- invalid request bodies return `400`

### `GET /battle/monster-move`

Query format:

```txt
/battle/monster-move?state=<url-encoded-json>
```

The `state` value must be valid JSON matching the battle state schema.

### `POST /battle/monster-move`

Request body format:

```json
{
  "monsterId": "goblin_warrior",
  "monsterCurrentHp": 80,
  "heroCurrentHp": 74,
  "heroMaxHp": 100,
  "heroStats": {
    "health": 100,
    "attack": 12,
    "defense": 10,
    "magic": 9
  },
  "turnNumber": 3,
  "heroLastMoveId": "slash",
  "monsterMoveHistory": ["dirty_kick", "rusty_blade"]
}
```

Response shape for both move endpoints:

```json
{
  "moveId": "rusty_blade",
  "move": {}
}
```

Validation and errors:

- invalid battle payloads return `400`
- unknown monster IDs return `404`
- monsters with no valid configured moves return `500`

## Monster AI

Monster move selection lives in [src/engine/gameEngine.ts](/c:/Users/aksaa/Documents/Projects/the-tower-server/src/engine/gameEngine.ts).

The server scores each valid move, then picks from a weighted random roll. It is not a fixed script.

Scoring considers:

- projected damage
- projected healing
- whether the move can finish the hero
- current monster HP ratio
- the hero's pressure from attack and magic
- buffs and debuffs, including duration and target
- HP costs on self-sacrificing skills
- repeated recent move usage
- whether the same move was used last turn

General tendencies:

- low-health monsters become more willing to heal or drain
- lethal damage gets a very high priority
- setup moves are more attractive earlier in battle
- defensive self-buffs are favored more when the hero is threatening
- repeated self-buffs and repeated same-turn patterns are discouraged

## Endless mode

Endless mode values come from `config.json`:

```json
{
  "enabled": true,
  "encountersPerLoop": 5,
  "healthMultiplierPerLoop": 1.22,
  "statMultiplierPerLoop": 1.11,
  "rewardMultiplierPerLoop": 1.3
}
```

Current behavior:

- each loop contains 5 encounters
- health scales by `1.22 ^ loopIndex`
- attack, defense, and magic scale by `1.11 ^ loopIndex`
- XP and coin rewards scale by `1.3 ^ loopIndex`
- loop index starts at `0` internally, while the API returns loop numbers starting at `1`

## Current game content

Current config includes:

- 8 heroes
- 5 base encounters
- 53 moves
- 15 items
- 5 environments
- 15 shop items

### Heroes

Current heroes:

- Knight
- Archer
- Armored Axeman
- Knight Templar
- Lancer
- Soldier
- Swordsman
- Priest

Each hero defines:

- `baseStats`
- `statsPerLevel`
- starting `moves`
- `equippedItems`
- `inventoryItems`
- `spriteKey`

### Encounter order

Base encounter order:

1. Goblin Warrior
2. Giant Spider
3. Goblin Mage
4. Witch
5. Dragon

Each encounter defines:

- core stats
- move list
- learnable moves
- equipped items
- inventory items
- rewards
- environment
- sprite key

### Environments

Current environments:

- Forest: no special effect
- Spider Nest: lowers hero defense by 1
- Lava Chamber: deals 3 damage per turn to the hero
- Magic Hall: gives both sides +3 magic
- Dragon Throne: applies a per-turn `attack -1` effect to the hero

Environment entries include:

- `heroEffects.statModifiers`
- `heroEffects.turnEffect`
- `monsterEffects.statModifiers`
- `monsterEffects.turnEffect`
- `spriteKey`

### Items

Current item registry contains equipment and inventory-style stat modifiers.

Examples of current items:

- defensive gear like `leather_helmet`, `iron_helmet`, `tower_bulwark`, and `dragon_scale_relic`
- health gear like `chain_armor`, `plate_armor`, and `field_tonic`
- attack gear like `iron_blade`, `steel_sword`, `hunter_bow`, and `war_drum`
- magic gear like `priest_charm` and `mana_relic`
- opponent debuff items like `cracked_totem` and `witch_lantern`

Each item has:

- `target`
- `statModifier.stat`
- `statModifier.value`
- `spriteKey`

### Shop

Current shop categories:

- stat upgrades: Health Tonic, Attack Training, Defense Training, Magic Training
- move unlocks: Power Strike Manual, Firebolt Tome, Hex Shield Sigil, Drain Life Grimoire, Shadow Bolt Tome
- item grants: Iron Helmet, Chain Armor, Iron Blade, Steel Sword, Mana Relic, Plate Armor

Shop item types:

- `stat`
- `move`
- `item`

`repeatable` is only true for the permanent stat upgrades in the current config.

## Reward and progression data

Current progression values:

```json
{
  "levelProgression": {
    "baseXpForNextLevel": 115,
    "additionalXpPerLevel": 65
  },
  "xpRewardScaling": {
    "multiplierPerKill": 0.97,
    "minimumReward": 45
  },
  "coinRewardScaling": {
    "multiplierPerKill": 0.93,
    "minimumReward": 18
  }
}
```

The server returns these values but does not apply client-side level-up or reward bookkeeping itself.

## What the client is expected to do

The client should:

- call `GET /run/config` at the start of a run
- let the player choose a hero from `heroes`
- use `encounters` for the initial battle sequence
- resolve move, item, and environment metadata from the returned registries
- apply level-up logic using `levelProgression`
- apply reward logic using `xpRewardScaling` and `coinRewardScaling`
- apply environment effects during battle
- call `POST /run/next-encounter` when endless mode needs the next encounter
- call a monster move endpoint once per monster turn

The client still owns:

- rendering and VFX
- battle resolution presentation
- inventory UI
- shop UI
- local run state
- save/load behavior

## Editing checklist

When changing `src/engine/config.json`, verify:

- every registry key matches its object's `id`
- all referenced moves exist
- all referenced items exist
- all referenced environments exist
- hero, encounter, and shop item IDs stay unique
- shop move entries reference real moves
- shop item entries reference real items

If any of those break, the server should fail fast during startup.
