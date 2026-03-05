"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpcomingFollowups = getUpcomingFollowups;
const db_1 = require("../db");
function getUpcomingFollowups(databasePath, params) {
    const days = params.days ?? 7;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const cutoffIso = cutoff.toISOString().split("T")[0];
    const database = (0, db_1.openDatabase)(databasePath);
    try {
        const rows = database.prepare(`
      SELECT id, name, tier, last_contact, next_followup, notes
      FROM contacts
      WHERE next_followup <= ?
      ORDER BY (tier = 'vip') DESC, next_followup ASC
    `).all(cutoffIso);
        return { success: true, count: rows.length, contacts: rows };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
    finally {
        database.close();
    }
}
