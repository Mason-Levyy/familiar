"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listContacts = listContacts;
const db_1 = require("../db");
function listContacts(databasePath, params) {
    const limit = params.limit ?? 20;
    const database = (0, db_1.openDatabase)(databasePath);
    try {
        let rows;
        if (params.tier) {
            rows = database.prepare(`
        SELECT id, name, tier, company, role, last_contact, next_followup
        FROM contacts WHERE tier = ? ORDER BY name LIMIT ?
      `).all(params.tier, limit);
        }
        else {
            rows = database.prepare(`
        SELECT id, name, tier, company, role, last_contact, next_followup
        FROM contacts ORDER BY tier, name LIMIT ?
      `).all(limit);
        }
        return { success: true, count: rows.length, contacts: rows };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
    finally {
        database.close();
    }
}
