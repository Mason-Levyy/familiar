"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findContact = findContact;
const db_1 = require("../db");
function findContact(databasePath, params) {
    const pattern = `%${params.query}%`;
    const database = (0, db_1.openDatabase)(databasePath);
    try {
        const contacts = database.prepare(`
      SELECT * FROM contacts
      WHERE name LIKE ? OR company LIKE ? OR notes LIKE ?
      ORDER BY (tier = 'vip') DESC, name ASC
      LIMIT 5
    `).all(pattern, pattern, pattern);
        const results = contacts.map((contact) => {
            const contactId = contact.id;
            const interactions = database.prepare(`
        SELECT type, summary, date FROM interactions
        WHERE contact_id = ? ORDER BY date DESC LIMIT 3
      `).all(contactId);
            return { ...contact, recent_interactions: interactions };
        });
        return { success: true, results };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
    finally {
        database.close();
    }
}
