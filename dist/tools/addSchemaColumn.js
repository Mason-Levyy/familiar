"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSchemaColumn = addSchemaColumn;
const db_1 = require("../db");
function addSchemaColumn(databasePath, params) {
    const tableName = params.table_name ?? "contacts";
    const columnType = params.column_type ?? "TEXT";
    const description = params.description ?? "";
    const database = (0, db_1.openDatabase)(databasePath);
    try {
        const existing = database.prepare("SELECT column_name FROM schema_meta WHERE table_name = ? AND column_name = ?").get(tableName, params.column_name);
        if (existing) {
            return {
                success: false,
                message: `Column '${params.column_name}' already exists in ${tableName}`,
            };
        }
        database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${params.column_name} ${columnType}`);
        database.prepare("INSERT INTO schema_meta (table_name, column_name, column_type, description) VALUES (?, ?, ?, ?)").run(tableName, params.column_name, columnType, description);
        return {
            success: true,
            message: `Added column '${params.column_name}' (${columnType}) to ${tableName}`,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
    finally {
        database.close();
    }
}
