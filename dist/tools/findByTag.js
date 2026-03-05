"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findByTag = findByTag;
const db_1 = require("../db");
function findByTag(databasePath, params) {
    const database = (0, db_1.openDatabase)(databasePath);
    try {
        const rows = database.prepare(`
      SELECT c.id, c.name, c.tier, c.company, c.role, c.last_contact
      FROM contacts c
      JOIN contact_tags ct ON c.id = ct.contact_id
      JOIN tags t ON ct.tag_id = t.id
      WHERE t.name LIKE ?
      ORDER BY c.tier
    `).all(`%${params.tag_name}%`);
        return { success: true, count: rows.length, contacts: rows };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
    finally {
        database.close();
    }
}
