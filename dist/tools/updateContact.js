"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContact = updateContact;
const db_1 = require("../db");
function updateContact(databasePath, params) {
    if (!params.fields || Object.keys(params.fields).length === 0) {
        return { success: false, error: "No fields to update" };
    }
    const columns = Object.keys(params.fields);
    const setClause = columns.map((column) => `${column} = ?`).join(", ");
    const values = [
        ...columns.map((column) => params.fields[column]),
        params.id,
    ];
    const database = (0, db_1.openDatabase)(databasePath);
    try {
        database.prepare(`UPDATE contacts SET ${setClause} WHERE id = ?`).run(...values);
        return { success: true, message: `Updated contact ${params.id}` };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
    finally {
        database.close();
    }
}
