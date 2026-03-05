"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTag = addTag;
const db_1 = require("../db");
function addTag(databasePath, params) {
    const database = (0, db_1.openDatabase)(databasePath);
    try {
        database.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)").run(params.tag_name);
        const tagRow = database.prepare("SELECT id FROM tags WHERE name = ?").get(params.tag_name);
        database.prepare("INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)").run(params.contact_id, tagRow.id);
        return {
            success: true,
            message: `Tagged contact ${params.contact_id} with '${params.tag_name}'`,
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
    finally {
        database.close();
    }
}
