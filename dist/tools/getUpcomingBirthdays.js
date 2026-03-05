"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpcomingBirthdays = getUpcomingBirthdays;
const db_1 = require("../db");
function getUpcomingBirthdays(databasePath, params) {
    const days = params.days ?? 14;
    const today = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const todayMonthDay = (0, db_1.formatMonthDay)(today);
    const cutoffMonthDay = (0, db_1.formatMonthDay)(cutoff);
    const database = (0, db_1.openDatabase)(databasePath);
    try {
        let rows;
        if (todayMonthDay <= cutoffMonthDay) {
            rows = database.prepare(`
        SELECT id, name, tier, birthday, notes
        FROM contacts
        WHERE birthday IS NOT NULL
          AND strftime('%m-%d', birthday) BETWEEN ? AND ?
        ORDER BY strftime('%m-%d', birthday)
      `).all(todayMonthDay, cutoffMonthDay);
        }
        else {
            rows = database.prepare(`
        SELECT id, name, tier, birthday, notes
        FROM contacts
        WHERE birthday IS NOT NULL
          AND (strftime('%m-%d', birthday) >= ? OR strftime('%m-%d', birthday) <= ?)
        ORDER BY strftime('%m-%d', birthday)
      `).all(todayMonthDay, cutoffMonthDay);
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
