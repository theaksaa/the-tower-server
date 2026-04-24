import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closeDb, db } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const migrationPath = path.join(__dirname, "migrations", "001_init.sql");
  const sql = await readFile(migrationPath, "utf8");

  await db.query(sql);
  console.log("Migrations completed.");
}

try {
  await migrate();
} finally {
  await closeDb();
}
