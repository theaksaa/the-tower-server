# RPG Gauntlet — Server

The server is the authoritative source for all game configuration and monster AI. It exposes two HTTP endpoints. The client calls them at defined moments in the game loop; the server never pushes data.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Endpoints](#endpoints)
   - [GET /run/config](#get-runconfig)
   - [POST /run/next-encounter](#post-runnext-encounter)
   - [GET /battle/monster-move](#get-battlemonster-move)
3. [Data Schemas](#data-schemas)
   - [RunConfig](#runconfig)
   - [Monster](#monster)
   - [Move](#move)
   - [BattleState](#battlestate)
   - [MonsterMoveResponse](#monstermoveresponse)
4. [Game Systems](#game-systems)
   - [Stats](#stats)
   - [Move Types & Damage Formula](#move-types--damage-formula)
   - [Hero Progression](#hero-progression)
5. [Monster Roster](#monster-roster)
6. [Full Moveset](#full-moveset)
7. [Bot Behavior](#bot-behavior)
8. [Error Handling](#error-handling)
9. [Extension Points (Bonus Features)](#extension-points-bonus-features)

---

## Architecture Overview

```
Client                          Server
  |                               |
  |-- GET /run/config ----------->|  Called once when the player starts a new run.
  |<-- RunConfig (5 monsters) ----|  Server returns the full encounter list.
  |                               |
  |-- POST /run/next-encounter -->|  Called when endless mode needs a new battle.
  |<-- NextEncounterResponse -----|  Server returns a scaled monster.
  |                               |
  |  [Player picks a move]        |
  |                               |
  |-- GET /battle/monster-move -->|  Called every turn after the player acts.
  |   (battle state as params)    |
  |<-- MonsterMoveResponse -------|  Server picks and returns the monster's move.
  |                               |
  |  [Client applies both moves,  |
  |   renders result, loops]      |
```

The client owns all rendering, animation, and UI state. The server owns game configuration and monster decision-making. This separation means the Game Designer can adjust monster stats, movesets, and bot logic without a client rebuild.

---

## Endpoints

### GET /run/config

Called **once** at the beginning of a run. Returns the complete encounter list the player will face, in order.

**Request**

No query parameters required.

```
GET /run/config
```

**Response** — `200 OK`

```json
{
  "runId": "string",
  "encounters": [
    { ...Monster },
    { ...Monster },
    { ...Monster },
    { ...Monster },
    { ...Monster }
  ],
  "heroes": [
    {
      "id": "knight",
      "name": "Knight",
      "description": "A durable frontline fighter with steady offense and self-sustain.",
      "spriteKey": "hero_knight",
      "baseStats": { ...Stats },
      "statsPerLevel": { ...Stats },
      "moves": ["move_id", "move_id", "move_id", "move_id"],
      "equippedItems": ["item_id"],
      "inventoryItems": ["item_id"]
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
    },
    {
      "id": "buy_field_tonic",
      "name": "Field Tonic",
      "description": "Adds a Field Tonic to the hero's inventory.",
      "spriteKey": "field_tonic",
      "cost": 45,
      "repeatable": false,
      "type": "item",
      "itemId": "field_tonic"
    }
  ],
  "moveRegistry": {
    "move_id": { ...Move },
    "move_id": { ...Move }
  },
  "itemRegistry": {
    "item_id": { ...Item },
    "item_id": { ...Item }
  },
  "environmentRegistry": {
    "environment_id": { ...Environment }
  }
}
```

The `moveRegistry` contains every move that exists in the game — both hero defaults and all monster moves. The client uses this to look up move details anywhere in the UI without a separate request.

`shopItems` contains permanent stat upgrades, move unlocks, and inventory item purchases for the client shop. Move shop entries always reference a valid move in `moveRegistry`, item shop entries always reference a valid item in `itemRegistry`, and `repeatable` tells the client whether the player can buy that item again.

`environmentRegistry` contains every battlefield environment. Each monster references one via `environmentId`, and the client should apply that environment's stat modifiers for the whole battle plus any per-turn damage or healing.

`levelProgression` defines infinite hero leveling. XP needed to go from level `N` to level `N + 1` is `baseXpForNextLevel + (N - 1) * additionalXpPerLevel`.

`endlessMode` describes how the server scales monsters when the client requests new endless encounters.

---

### POST /run/next-encounter

Called when the client wants the server to generate the next endless encounter.

**Request**

```http
POST /run/next-encounter
Content-Type: application/json
```

```json
{
  "encountersCleared": 5
}
```

**Response** - `200 OK`

```json
{
  "encounterNumber": 6,
  "loopNumber": 2,
  "baseMonsterId": "goblin_warrior",
  "monster": { ...Monster }
}
```

---

### GET /battle/monster-move

Called **every turn**, after the player has selected and applied their move. The client sends the current battle state; the server responds with the move the monster will play this turn.

**Request**

Battle state is passed as a JSON query parameter (`state`) to keep the endpoint a clean GET and avoid CORS preflight on simple clients. For large payloads, the server may alternatively accept it as a POST body — document whichever you implement.

```
GET /battle/monster-move?state=<URL-encoded JSON BattleState>
```

Or as a POST body if query string length is a concern:

```
POST /battle/monster-move
Content-Type: application/json

{ ...BattleState }
```

**Response** — `200 OK`

```json
{
  "moveId": "string",
  "move": { ...Move }
}
```

The client resolves damage/healing client-side using the returned move and the monster's stats (already known from `/run/config`). The server does not return a resolved damage number — this keeps the endpoint stateless and lets the client animate the result.

---

## Data Schemas

All fields are required unless marked optional.

### RunConfig

| Field | Type | Description |
|---|---|---|
| `runId` | `string` | Unique identifier for this run. Used for save/resume (bonus feature). |
| `encounters` | `Monster[]` | Exactly 5 monsters, ordered from first to last. |
| `heroes` | `HeroDefaults[]` | Selectable hero definitions the client can offer at the start of a run. |
| `levelProgression` | `LevelProgression` | Infinite XP progression config for calculating the next level requirement. |
| `endlessMode` | `EndlessModeConfig` | Server-side endless encounter scaling settings. |
| `xpRewardScaling` | `XpRewardScaling` | Global settings for reducing monster XP rewards after each kill. |
| `coinRewardScaling` | `CoinRewardScaling` | Global settings for reducing monster coin rewards after each kill. |
| `shopItems` | `ShopItem[]` | Shop entries for permanent stat upgrades, move unlocks, and item purchases. |
| `moveRegistry` | `Record<string, Move>` | All moves in the game, keyed by move ID. |
| `itemRegistry` | `Record<string, Item>` | All items in the game, keyed by item ID. |
| `environmentRegistry` | `Record<string, Environment>` | All environments in the game, keyed by environment ID. |

### Environment

`Environment` defines passive battlefield effects for each side:

```ts
type Environment = {
  id: string;
  name: string;
  description: string;
  spriteKey: string;
  heroEffects: {
    statModifiers: Partial<Record<"health" | "attack" | "defense" | "magic", number>>;
    turnEffect:
      | { type: "damage" | "heal"; value: number }
      | { type: "stat_modifier"; stat: "attack" | "defense" | "magic"; value: number }
      | null;
  };
  monsterEffects: {
    statModifiers: Partial<Record<"health" | "attack" | "defense" | "magic", number>>;
    turnEffect:
      | { type: "damage" | "heal"; value: number }
      | { type: "stat_modifier"; stat: "attack" | "defense" | "magic"; value: number }
      | null;
  };
};
```

`spriteKey` is the asset key for the environment background. Environment stat modifiers last for the whole battle. `turnEffect` should be applied once per turn to that side.

### EndlessModeConfig

| Field | Type | Description |
|---|---|---|
| `enabled` | `boolean` | Whether endless encounter generation is available. |
| `encountersPerLoop` | `number` | Number of base encounters before the roster loops back to the start. |
| `healthMultiplierPerLoop` | `number` | Applied to monster `health` each time the roster loops. |
| `statMultiplierPerLoop` | `number` | Applied to monster `attack`, `defense`, and `magic` each loop. |
| `rewardMultiplierPerLoop` | `number` | Applied to monster `xpReward` and `coinReward` each loop. |

### ShopItem

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier for the shop entry. |
| `name` | `string` | Display name shown in the shop UI. |
| `description` | `string` | Short summary of the item's effect. |
| `spriteKey` | `string` | Asset key used for the shop icon. |
| `cost` | `number` | Coin cost to buy the item. |
| `repeatable` | `boolean` | Whether the player can purchase the item multiple times. |
| `type` | `"stat" \| "move" \| "item"` | Distinguishes stat upgrades, move unlocks, and item purchases. |
| `stat` | `"health" \| "attack" \| "defense" \| "magic"` | Only present when `type` is `"stat"`. |
| `value` | `number` | Only present when `type` is `"stat"`; the permanent stat increase. |
| `moveId` | `string` | Only present when `type` is `"move"`; must exist in `moveRegistry`. |
| `itemId` | `string` | Only present when `type` is `"item"`; must exist in `itemRegistry`. |

### HeroDefaults

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier for the hero option. |
| `name` | `string` | Display name shown in hero selection UI. |
| `description` | `string` | Short archetype summary for the client. |
| `spriteKey` | `string` | Asset key the client uses to render the hero portrait or sprite. |
| `baseStats` | `Stats` | Stats at level 1. |
| `statsPerLevel` | `Stats` | Flat stat increase applied on each level-up. |
| `moves` | `string[]` | Move IDs in the hero's starting equipped moveset (4 moves). |
| `equippedItems` | `string[]` | Item IDs in the hero's starting equipped item set (max 4). |
| `inventoryItems` | `string[]` | Item IDs the hero owns but does not start equipped. |

### Stats

Applies to both heroes and monsters.

| Field | Type | Description |
|---|---|---|
| `health` | `number` | Maximum hit points. |
| `attack` | `number` | Scales physical move damage. |
| `defense` | `number` | Reduces incoming physical damage. |
| `magic` | `number` | Scales magic move damage and healing. |

```json
{
  "health": 120,
  "attack": 18,
  "defense": 10,
  "magic": 12
}
```

### Monster

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (e.g. `"goblin_scout"`). |
| `name` | `string` | Display name. |
| `description` | `string` | Flavour text shown to the player. |
| `environmentId` | `string` | Environment used for this battle. Look it up in `environmentRegistry`. |
| `stats` | `Stats` | Fixed stats. Monsters do not level up. |
| `moves` | `string[]` | Move IDs this monster can use in battle. |
| `equippedItems` | `string[]` | Item IDs the monster has equipped (max 4). |
| `inventoryItems` | `string[]` | Item IDs the monster is carrying but not using. |
| `learnableMoves` | `string[]` | Move IDs the hero can learn upon winning. One is chosen at random by the client. |
| `xpReward` | `number` | XP awarded to the hero on victory. |
| `coinReward` | `number` | Base coins awarded for killing this monster before decay is applied. |
| `spriteKey` | `string` | Asset key the client uses to render the monster sprite. |

```json
{
  "id": "goblin_warrior",
  "name": "Goblin Warrior",
  "description": "A scrappy fighter who wins through cheap shots and reckless aggression.",
  "environmentId": "forest",
  "stats": { "health": 70, "attack": 15, "defense": 7, "magic": 4 },
  "moves": ["rusty_blade", "dirty_kick", "frenzy", "headbutt"],
  "equippedItems": ["cracked_totem"],
  "inventoryItems": [],
  "learnableMoves": ["rusty_blade", "dirty_kick", "frenzy", "headbutt"],
  "xpReward": 80,
  "coinReward": 40,
  "spriteKey": "goblin_warrior"
}
```

### CoinRewardScaling

| Field | Type | Description |
|---|---|---|
| `multiplierPerKill` | `number` | Multiplier applied once for each monster already killed in the current run. |
| `minimumReward` | `number` | Lowest coin payout allowed after scaling and rounding. |

Suggested client formula:

```ts
const reward = Math.max(
  runConfig.coinRewardScaling.minimumReward,
  Math.round(
    monster.coinReward *
      runConfig.coinRewardScaling.multiplierPerKill ** monstersKilledSoFar
  )
);
```

### XpRewardScaling

| Field | Type | Description |
|---|---|---|
| `multiplierPerKill` | `number` | Multiplier applied once for each monster already killed in the current run. |
| `minimumReward` | `number` | Lowest XP payout allowed after scaling and rounding. |

Suggested client formula:

```ts
const xpReward = Math.max(
  runConfig.xpRewardScaling.minimumReward,
  Math.round(
    monster.xpReward *
      runConfig.xpRewardScaling.multiplierPerKill ** monstersKilledSoFar
  )
);
```

### LevelProgression

| Field | Type | Description |
|---|---|---|
| `baseXpForNextLevel` | `number` | XP needed to go from level 1 to level 2. |
| `additionalXpPerLevel` | `number` | Extra XP added to each later level requirement. |

Suggested client formula:

```ts
const xpNeededForNextLevel =
  runConfig.levelProgression.baseXpForNextLevel +
  (currentLevel - 1) * runConfig.levelProgression.additionalXpPerLevel;
```

### Move

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (e.g. `"heavy_strike"`). |
| `name` | `string` | Display name. |
| `description` | `string` | Tooltip text explaining what the move does. |
| `spriteKey` | `string` | Asset key the client uses for the move icon or card art. |
| `type` | `"physical" \| "magic" \| "status"` | Determines whether the move is physical damage, magic damage/healing, or a non-damage status move. |
| `effect` | `"damage" \| "heal" \| "drain" \| "stat_modifier" \| "damage_and_stat_modifier"` | Main effect of the move. `statModifier` can be applied alone or together with damage. |
| `target` | `"self" \| "opponent"` | Who is affected. |
| `basePower` | `number` | Base value before stat scaling. Use `0` for pure buff/debuff moves. |
| `statMultiplier` | `number` | Multiplier applied to the relevant stat before adding to base power. Use `0` for pure buff/debuff moves. |
| `statModifier` | `StatModifier \| null` | Optional signed stat modifier. Positive `value` buffs the target; negative `value` debuffs the target. |
| `hpCost` | `number \| null` | Optional HP cost paid by the move user before the effect resolves. |

```json
{
  "id": "battle_cry",
  "name": "Battle Cry",
  "description": "Raises the user's Attack for two turns.",
  "type": "status",
  "effect": "stat_modifier",
  "target": "self",
  "basePower": 0,
  "statMultiplier": 0,
  "statModifier": {
    "stat": "attack",
    "value": 6,
    "durationTurns": 2
  },
  "hpCost": null
}
```

### StatModifier

Used by moves that temporarily change `attack`, `defense`, or `magic`.

| Field | Type | Description |
|---|---|---|
| `stat` | `"attack" \| "defense" \| "magic"` | The stat being modified. |
| `value` | `number` | Signed flat modifier. Positive values increase the stat, negative values decrease it. |
| `durationTurns` | `number` | How many turns the modifier lasts. |

Examples:

```json
{
  "stat": "magic",
  "value": 6,
  "durationTurns": 2
}
```

```json
{
  "stat": "magic",
  "value": -5,
  "durationTurns": 2
}
```

This means the implementation does not need a separate `operation` field. A buff is just a positive `value`; a debuff is just a negative `value`.

### Item

`Item` is a stat-only battle modifier:

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

Items never deal damage, heal, or drain. They only buff or debuff `self` or `opponent`, and their effect stays active for the whole battle while equipped. Items can also modify `health`, which the client should treat as max Health. Items live in `equippedItems` or `inventoryItems`, can be dropped by monsters, and are lost if the hero dies.

### BattleState

Sent by the client to `/battle/monster-move` each turn.

| Field | Type | Description |
|---|---|---|
| `monsterId` | `string` | ID of the monster being fought. |
| `monsterCurrentHp` | `number` | Monster's remaining HP this battle. |
| `heroCurrentHp` | `number` | Hero's remaining HP this battle. |
| `heroMaxHp` | `number` | Hero's maximum HP (for heal capping and AI context). |
| `heroStats` | `Stats` | Hero's current resolved stats (post level-up). |
| `turnNumber` | `number` | Current turn (1-indexed). |
| `heroLastMoveId` | `string \| null` | The move the hero just played. `null` on turn 1. |
| `monsterMoveHistory` | `string[]` | Ordered list of move IDs the monster has played so far this battle. |

```json
{
  "monsterId": "dragon",
  "monsterCurrentHp": 170,
  "heroCurrentHp": 72,
  "heroMaxHp": 180,
  "heroStats": { "health": 180, "attack": 28, "defense": 18, "magic": 20 },
  "turnNumber": 4,
  "heroLastMoveId": "slash",
  "monsterMoveHistory": ["flame_breath", "dragon_scales", "claw_swipe"]
}
```

### MonsterMoveResponse

| Field | Type | Description |
|---|---|---|
| `moveId` | `string` | The ID of the move the monster plays. Must be in the monster's `moves` array from config. |
| `move` | `Move` | Full move object for convenience (client can also look this up in its local `moveRegistry`). |

```json
{
  "moveId": "flame_breath",
  "move": {
    "id": "flame_breath",
    "name": "Flame Breath",
    "description": "Magic attack that deals heavy damage. Scales off Magic.",
    "type": "magic",
    "effect": "damage",
    "target": "opponent",
    "basePower": 30,
    "statMultiplier": 1.3,
    "statModifier": null,
    "hpCost": null
  }
}
```

---

## Game Systems

### Stats

Every character has four stats:

| Stat | Role |
|---|---|
| `health` | Hit points. Reach 0 and you lose the fight. |
| `attack` | Scales physical move damage. |
| `defense` | Reduces incoming physical damage. |
| `magic` | Scales magic move damage and healing. |

Monsters have fixed stats defined in the server config. The hero's stats grow on level-up.

### Move Types & Damage Formula

**Physical damage:**

```
damage = (move.basePower + attacker.attack * move.statMultiplier) - target.defense
damage = max(1, damage)   // Always deal at least 1 damage
```

**Magic damage:**

```
damage = move.basePower + attacker.magic * move.statMultiplier
// Defense does not apply to magic damage
```

**Healing:**

```
heal = move.basePower + caster.magic * move.statMultiplier
newHp = min(caster.maxHp, caster.currentHp + heal)
```

**Drain:**

```
damage = move.basePower + attacker.magic * move.statMultiplier
target.currentHp = max(0, target.currentHp - damage)
attacker.currentHp = min(attacker.maxHp, attacker.currentHp + damage)
```

**Buffs and debuffs:**

```
modifiedStat = originalStat + move.statModifier.value
modifier expires after move.statModifier.durationTurns
```

Positive modifier values are buffs. Negative modifier values are debuffs. Buff and debuff moves last **two turns** in the current move set. The client resolves all of this. The server only returns which move the monster plays.

### Hero Progression

- The client selects one entry from `heroes` at the start of the run.
- The chosen hero starts at **Level 1** with that hero's `baseStats` and `moves`.
- The chosen hero also starts with that hero's default `equippedItems` and `inventoryItems`.
- Each battle awards XP. Start from `monster.xpReward`, then reduce it by `xpRewardScaling.multiplierPerKill` for each monster already killed in the run, never going below `xpRewardScaling.minimumReward`.
- Each battle also awards coins. Start from `monster.coinReward`, then reduce it by `coinRewardScaling.multiplierPerKill` for each monster already killed in the run, never going below `coinRewardScaling.minimumReward`.
- When accumulated XP reaches the current next-level requirement from `levelProgression`, the hero levels up.
- On level-up, each stat increases by the corresponding value in the chosen hero's `statsPerLevel`.
- The hero can equip up to **4 moves** at a time, chosen from all moves they have learned.
- The hero can equip up to **4 items** at a time, chosen from the items they currently own.
- Equipped item effects stay active for the whole battle and do not expire after turns.
- If an equipped item modifies `health`, the client should apply it as a max-Health bonus while that item remains equipped.
- The client should also apply the active environment from `environmentRegistry[monster.environmentId]`.
- Environment stat modifiers last for the whole battle.
- Environment turn effects trigger once per turn for the hero and monster independently.
- After winning a battle, one of `monster.learnableMoves` is selected at random and added to the hero's learned pool. The player then decides whether to equip it before the next fight.
- If the monster dies, the client can award that monster's `equippedItems` and `inventoryItems` as drops. If the hero dies, the hero loses their items.

---

## Monster Roster

The five encounters are ordered by increasing difficulty. Stats and movesets are tunable in the server config without a client rebuild.

| # | Name | Role | Design Intent |
|---|---|---|---|
| 1 | **Goblin Warrior** | Physical opener | Introduces physical damage, Attack buffs, and Defense debuffs. |
| 2 | **Giant Spider** | Physical control | Uses Defense buffs and Defense-lowering attacks to punish long fights. |
| 3 | **Goblin Mage** | Magic specialist | Introduces Magic scaling, Magic buffs, and Magic debuffs. |
| 4 | **Witch** | Drain caster | Uses heavy magic damage, self-healing through damage, and Attack debuffs. |
| 5 | **Dragon** | Final boss | Mixed physical and magic threat with Attack debuffs and Defense buffs. |

> **Tuning note:** Adjust `xpReward`, `coinReward`, stats, and movesets in the config until a hero on a clean first run can realistically beat encounter 1 at level 1 and will need level 3–4 to reliably beat encounter 5.

---

## Full Moveset

All moves are defined in `moveRegistry` returned by `/run/config`. Below is the intended base set. Exact numbers should be tuned during playtesting.

### Hero Default Moves (Knight)

| ID | Name | Type | Effect | Target | Base Power | Stat Mult | Stat Modifier | HP Cost | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `slash` | Slash | Physical | damage | opponent | 15 | 1.0 | — | — | Moderate physical damage. Scales off Attack and is reduced by Defense. |
| `shield_up` | Shield Up | Status | stat_modifier | self | 0 | 0 | `{ stat: "defense", value: 6, durationTurns: 2 }` | — | No damage; raises the knight's Defense. |
| `battle_cry` | Battle Cry | Status | stat_modifier | self | 0 | 0 | `{ stat: "attack", value: 6, durationTurns: 2 }` | — | No damage; raises the knight's Attack. |
| `second_wind` | Second Wind | Magic | heal | self | 18 | 0.8 | — | — | Moderate heal. Scales off Magic. |

### Witch Moves

| ID | Name | Type | Effect | Target | Base Power | Stat Mult | Stat Modifier | HP Cost | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `shadow_bolt` | Shadow Bolt | Magic | damage | opponent | 28 | 1.2 | — | — | Heavy magic damage. Scales off Magic. |
| `drain_life` | Drain Life | Magic | drain | opponent | 10 | 0.7 | — | — | Light magic damage and heals the user for the same amount. |
| `curse` | Curse | Status | stat_modifier | opponent | 0 | 0 | `{ stat: "attack", value: -6, durationTurns: 2 }` | — | Lowers the target's Attack. |
| `dark_pact` | Dark Pact | Status | stat_modifier | self | 0 | 0 | `{ stat: "magic", value: 8, durationTurns: 2 }` | 10 | Raises Magic at the cost of the user's HP. |

### Giant Spider Moves

| ID | Name | Type | Effect | Target | Base Power | Stat Mult | Stat Modifier | HP Cost | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `bite` | Bite | Physical | damage | opponent | 14 | 1.0 | — | — | Moderate physical damage. Scales off Attack and is reduced by Defense. |
| `web_throw` | Web Throw | Physical | damage_and_stat_modifier | opponent | 8 | 0.7 | `{ stat: "defense", value: -5, durationTurns: 2 }` | — | Light physical damage and lowers target Defense. |
| `pounce` | Pounce | Physical | damage | opponent | 26 | 1.2 | — | — | Heavy physical damage. Scales off Attack and is reduced by Defense. |
| `skitter` | Skitter | Status | stat_modifier | self | 0 | 0 | `{ stat: "defense", value: 6, durationTurns: 2 }` | — | No damage; raises the spider's Defense. |

### Dragon Moves

| ID | Name | Type | Effect | Target | Base Power | Stat Mult | Stat Modifier | HP Cost | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `flame_breath` | Flame Breath | Magic | damage | opponent | 30 | 1.3 | — | — | Heavy magic damage. Scales off Magic. |
| `claw_swipe` | Claw Swipe | Physical | damage | opponent | 18 | 1.0 | — | — | Moderate physical damage. Scales off Attack and is reduced by Defense. |
| `intimidate` | Intimidate | Status | stat_modifier | opponent | 0 | 0 | `{ stat: "attack", value: -6, durationTurns: 2 }` | — | No damage; lowers target Attack. |
| `dragon_scales` | Dragon Scales | Status | stat_modifier | self | 0 | 0 | `{ stat: "defense", value: 8, durationTurns: 2 }` | — | No damage; raises user Defense. |

### Goblin Warrior Moves

| ID | Name | Type | Effect | Target | Base Power | Stat Mult | Stat Modifier | HP Cost | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `rusty_blade` | Rusty Blade | Physical | damage | opponent | 14 | 1.0 | — | — | Moderate physical damage. Scales off Attack and is reduced by Defense. |
| `dirty_kick` | Dirty Kick | Physical | damage_and_stat_modifier | opponent | 8 | 0.7 | `{ stat: "defense", value: -5, durationTurns: 2 }` | — | Light physical damage and lowers target Defense. |
| `frenzy` | Frenzy | Status | stat_modifier | self | 0 | 0 | `{ stat: "attack", value: 6, durationTurns: 2 }` | — | No damage; raises user Attack. |
| `headbutt` | Headbutt | Physical | damage | opponent | 26 | 1.2 | — | — | Heavy physical damage. Scales off Attack and is reduced by Defense. |

### Goblin Mage Moves

| ID | Name | Type | Effect | Target | Base Power | Stat Mult | Stat Modifier | HP Cost | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `firebolt` | Firebolt | Magic | damage | opponent | 18 | 1.0 | — | — | Moderate magic damage. Scales off Magic. |
| `arcane_surge` | Arcane Surge | Status | stat_modifier | self | 0 | 0 | `{ stat: "magic", value: 6, durationTurns: 2 }` | — | No damage; raises user Magic. |
| `mana_drain` | Mana Drain | Magic | damage_and_stat_modifier | opponent | 10 | 0.7 | `{ stat: "magic", value: -5, durationTurns: 2 }` | — | Light magic damage and lowers target Magic. |
| `hex_shield` | Hex Shield | Status | stat_modifier | self | 0 | 0 | `{ stat: "defense", value: 6, durationTurns: 2 }` | — | No damage; raises user Defense. |

---

## Bot Behavior

The default bot is **random weighted selection**. On each turn, the server picks from the monster's `moves` array with equal probability. This is intentionally simple for the prototype.

The bot selection logic lives entirely in `/battle/monster-move`, so it can be changed without touching the client.

**Current algorithm (v1 — random):**

```
selectedMove = random choice from monster.moves
```

**Planned algorithm (v2 — situational, bonus feature #8):**

The `BattleState` payload already includes everything needed for conditional logic:

- `monsterCurrentHp` — prioritize healing moves when HP is below a threshold (e.g. < 30%)
- `heroLastMoveId` — counter physical with physical; counter magic with high magic output
- `turnNumber` — open with a specific move (e.g. always buff on turn 1)
- `monsterMoveHistory` — avoid repeating the same move too many times in a row

Switching from v1 to v2 is a server-only change. The client calls the same endpoint and gets the same response shape.

---

## Error Handling

| Scenario | HTTP Status | Response |
|---|---|---|
| Invalid or missing `state` param | `400` | `{ "error": "invalid_battle_state", "message": "..." }` |
| Unknown `monsterId` in state | `404` | `{ "error": "monster_not_found", "message": "..." }` |
| Internal server error | `500` | `{ "error": "server_error", "message": "..." }` |
| Invalid `/run/next-encounter` request | `400` | `{ "error": "invalid_next_encounter_request", "message": "..." }` |

All error responses use the shape:

```json
{
  "error": "error_code",
  "message": "Human-readable description"
}
```

---

## Extension Points (Bonus Features)

The schema is designed to accommodate the Game Designer's backlog with minimal breaking changes.

| Feature | What to add |
|---|---|
| **Move descriptions (#1)** | Already in `Move.description`. Client just needs to wire up the hover tooltip. |
| **Attribute choices on level-up (#2)** | Add an optional `levelUpChoices: number` field to each hero definition. Server returns stat options; client presents them. |
| **Status effects (#3)** | Buffs and debuffs already use `statModifier`. For poison, burn, stun, etc., add `statusEffect?: { type: string, duration: number, value: number }` to `Move`. |
| **Resource costs (#4)** | `hpCost` already supports moves like Dark Pact. Add `manaCost?: number`, `mana`, and `manaRegen` if mana becomes part of the game. |
| **Save & Exit (#5)** | Store `runId` + hero state in persistent storage server-side. Add `GET /run/{runId}` to resume. |
| **Battle log (#6)** | `MonsterMoveResponse` can include an optional `logEntry: string` the server generates from the move result. |
| **Smarter bot (#8)** | Change the selection logic inside `/battle/monster-move` only. Schema unchanged. |
| **Items (#9)** | Implemented via `itemRegistry`, `equippedItems`, and `inventoryItems` on heroes and monsters. |
| **Environments** | Implemented via `environmentRegistry` plus `monster.environmentId`. |
| **Non-linear map (#12)** | Change `encounters` from `Monster[]` to a graph structure: `nodes: MonsterNode[]`, `edges: { from: string, to: string }[]`. |
| **Hero classes (#15)** | Already covered by the `heroes` array in `GET /run/config`; expand it with more variants as needed. |
