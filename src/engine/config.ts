import rawConfig from "./config.json" with { type: "json" };
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
  XpRewardScaling
} from "./types.js";

type GameConfigFile = {
  levelProgression: LevelProgression;
  endlessMode: EndlessModeConfig;
  xpRewardScaling: XpRewardScaling;
  coinRewardScaling: CoinRewardScaling;
  moveRegistry: MoveRegistry;
  itemRegistry: ItemRegistry;
  environmentRegistry: EnvironmentRegistry;
  heroes: HeroDefaults[];
  encounters: Monster[];
  shopItems: ShopItem[];
};

const config = rawConfig as GameConfigFile;

const normalizeMoveRegistry = (definitions: MoveRegistry): MoveRegistry =>
  Object.fromEntries(
    Object.entries(definitions).map(([moveId, move]) => [
      moveId,
      {
        ...move,
        spriteKey: move.spriteKey ?? move.id ?? moveId
      }
    ])
  );

const normalizeItemRegistry = (definitions: ItemRegistry): ItemRegistry =>
  Object.fromEntries(
    Object.entries(definitions).map(([itemId, item]) => [
      itemId,
      {
        ...item,
        spriteKey: item.spriteKey ?? item.id ?? itemId
      }
    ])
  );

const normalizeEnvironmentRegistry = (
  definitions: EnvironmentRegistry
): EnvironmentRegistry =>
  Object.fromEntries(
    Object.entries(definitions).map(([environmentId, environment]) => [
      environmentId,
      {
        ...environment,
        spriteKey: environment.spriteKey ?? environment.id ?? environmentId
      }
    ])
  );

function assertUniqueIds(values: readonly { id: string }[], collectionName: string) {
  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value.id)) {
      throw new Error(`duplicate_${collectionName}_id:${value.id}`);
    }

    seen.add(value.id);
  }
}

function assertRecordKeysMatchIds(
  entries: Record<string, { id: string }>,
  collectionName: string
) {
  for (const [key, value] of Object.entries(entries)) {
    if (key !== value.id) {
      throw new Error(`mismatched_${collectionName}_key:${key}:${value.id}`);
    }
  }
}

function assertMoveExists(moveId: string, source: string) {
  if (!moveRegistry[moveId]) {
    throw new Error(`unknown_move:${source}:${moveId}`);
  }
}

function assertItemExists(itemId: string, source: string) {
  if (!itemRegistry[itemId]) {
    throw new Error(`unknown_item:${source}:${itemId}`);
  }
}

function assertEnvironmentExists(environmentId: string, source: string) {
  if (!environmentRegistry[environmentId]) {
    throw new Error(`unknown_environment:${source}:${environmentId}`);
  }
}

export const levelProgression = config.levelProgression;
export const endlessMode = config.endlessMode;
export const xpRewardScaling = config.xpRewardScaling;
export const coinRewardScaling = config.coinRewardScaling;
export const moveRegistry = normalizeMoveRegistry(config.moveRegistry);
export const itemRegistry = normalizeItemRegistry(config.itemRegistry);
export const environmentRegistry = normalizeEnvironmentRegistry(config.environmentRegistry);
export const heroes = config.heroes;
export const encounters = config.encounters;
export const shopItems = config.shopItems;

assertRecordKeysMatchIds(moveRegistry, "move");
assertRecordKeysMatchIds(itemRegistry, "item");
assertRecordKeysMatchIds(environmentRegistry, "environment");
assertUniqueIds(heroes, "hero");
assertUniqueIds(encounters, "encounter");
assertUniqueIds(shopItems, "shop_item");

for (const hero of heroes) {
  hero.moves.forEach((moveId) => assertMoveExists(moveId, `hero:${hero.id}:moves`));
  hero.equippedItems.forEach((itemId) => assertItemExists(itemId, `hero:${hero.id}:equipped`));
  hero.inventoryItems.forEach((itemId) => assertItemExists(itemId, `hero:${hero.id}:inventory`));
}

for (const encounter of encounters) {
  assertEnvironmentExists(encounter.environmentId, `encounter:${encounter.id}:environment`);
  encounter.moves.forEach((moveId) => assertMoveExists(moveId, `encounter:${encounter.id}:moves`));
  encounter.learnableMoves.forEach((moveId) =>
    assertMoveExists(moveId, `encounter:${encounter.id}:learnable_moves`)
  );
  encounter.equippedItems.forEach((itemId) =>
    assertItemExists(itemId, `encounter:${encounter.id}:equipped`)
  );
  encounter.inventoryItems.forEach((itemId) =>
    assertItemExists(itemId, `encounter:${encounter.id}:inventory`)
  );
}

for (const shopItem of shopItems) {
  if (shopItem.type === "move") {
    assertMoveExists(shopItem.moveId, `shop_item:${shopItem.id}`);
  }

  if (shopItem.type === "item") {
    assertItemExists(shopItem.itemId, `shop_item:${shopItem.id}`);
  }
}

export function getMove(moveId: string): Move | undefined {
  return moveRegistry[moveId];
}

export function getItem(itemId: string): Item | undefined {
  return itemRegistry[itemId];
}

export function getEnvironment(environmentId: string): Environment | undefined {
  return environmentRegistry[environmentId];
}
