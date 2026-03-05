"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchByIndustry = searchByIndustry;
const db_1 = require("../db");
function searchByIndustry(databasePath, params) {
    if (!params.industry && !params.company) {
        return { success: false, error: "Provide industry or company" };
    }
    const database = (0, db_1.openDatabase)(databasePath);
    try {
        let rows;
        if (params.company) {
            rows = database.prepare(`
        SELECT id, name, tier, role, company, industry, last_contact, notes
        FROM contacts WHERE company LIKE ? ORDER BY tier
      `).all(`%${params.company}%`);
        }
        else {
            rows = database.prepare(`
        SELECT id, name, tier, role, company, industry, last_contact, notes
        FROM contacts WHERE industry LIKE ? ORDER BY tier
      `).all(`%${params.industry}%`);
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
