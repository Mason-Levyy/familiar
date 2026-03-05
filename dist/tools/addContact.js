"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addContact = addContact;
const db_1 = require("../db");
function addContact(databasePath, params) {
    const computedFollowup = params.next_followup ?? (0, db_1.followupDate)(params.tier);
    const database = (0, db_1.openDatabase)(databasePath);
    try {
        const statement = database.prepare(`
      INSERT INTO contacts
        (name, tier, email, phone, location, company, industry,
         role, birthday, how_met, notes, next_followup)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = statement.run(params.name, params.tier, params.email ?? null, params.phone ?? null, params.location ?? null, params.company ?? null, params.industry ?? null, params.role ?? null, params.birthday ?? null, params.how_met ?? null, params.notes ?? null, computedFollowup);
        return {
            success: true,
            id: Number(result.lastInsertRowid),
            message: `Added ${params.name} (${params.tier})`,
            next_followup: computedFollowup,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
    finally {
        database.close();
    }
}
