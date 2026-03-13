import { openDatabase } from "../db";

const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const ALLOWED_TABLES = new Set([
  "contacts", "interactions", "tags", "contact_tags", "schema_meta",
  "projects", "tasks", "project_logs",
]);
const ALLOWED_COLUMN_TYPES = new Set(["TEXT", "INTEGER", "REAL", "NUMERIC", "BLOB"]);

interface AddSchemaColumnParams {
  table_name?: string;
  column_name: string;
  column_type?: string;
  description?: string;
}

export function addSchemaColumn(databasePath: string, params: AddSchemaColumnParams) {
  const tableName = params.table_name ?? "contacts";
  const columnType = (params.column_type ?? "TEXT").toUpperCase();
  const description = params.description ?? "";

  if (!ALLOWED_TABLES.has(tableName)) {
    return { success: false, error: `Unknown table "${tableName}"` };
  }
  if (!VALID_IDENTIFIER.test(params.column_name)) {
    return { success: false, error: `Invalid column name "${params.column_name}"` };
  }
  if (!ALLOWED_COLUMN_TYPES.has(columnType)) {
    return { success: false, error: `Unsupported column type "${columnType}" — use TEXT, INTEGER, REAL, NUMERIC, or BLOB` };
  }

  const database = openDatabase(databasePath);
  try {
    const existing = database.prepare(
      "SELECT column_name FROM schema_meta WHERE table_name = ? AND column_name = ?"
    ).get(tableName, params.column_name);

    if (existing) {
      return {
        success: false,
        message: `Column '${params.column_name}' already exists in ${tableName}`,
      };
    }

    database.exec(
      `ALTER TABLE "${tableName}" ADD COLUMN "${params.column_name}" ${columnType}`
    );
    database.prepare(
      "INSERT INTO schema_meta (table_name, column_name, column_type, description) VALUES (?, ?, ?, ?)"
    ).run(tableName, params.column_name, columnType, description);

    return {
      success: true,
      message: `Added column '${params.column_name}' (${columnType}) to ${tableName}`,
    };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
