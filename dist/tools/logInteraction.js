"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInteraction = logInteraction;
const db_1 = require("../db");
function logInteraction(databasePath, params) {
    const interactionDate = params.date ?? (0, db_1.todayIso)();
    const database = (0, db_1.openDatabase)(databasePath);
    try {
        database.prepare("INSERT INTO interactions (contact_id, type, summary, date) VALUES (?, ?, ?, ?)").run(params.contact_id, params.type, params.summary, interactionDate);
        const row = database.prepare("SELECT tier FROM contacts WHERE id = ?").get(params.contact_id);
        const tier = row?.tier ?? "broader";
        const nextFollowup = (0, db_1.followupDate)(tier);
        database.prepare("UPDATE contacts SET last_contact = ?, next_followup = ? WHERE id = ?").run(interactionDate, nextFollowup, params.contact_id);
        return {
            success: true,
            message: `Logged interaction, next follow-up: ${nextFollowup}`,
            next_followup: nextFollowup,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
    finally {
        database.close();
    }
}
