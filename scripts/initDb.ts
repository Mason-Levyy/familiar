import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const schemaPath = resolve(projectRoot, "db", "schema.sql");
const databasePath = process.env.CRM_DB_PATH ?? resolve(projectRoot, "db", "familiar.db");

const schemaSql = readFileSync(schemaPath, "utf-8");

mkdirSync(dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec("PRAGMA journal_mode = WAL");
database.exec("PRAGMA foreign_keys = ON");
database.exec(schemaSql);
database.close();

console.log(`Database initialized at ${databasePath}`);
