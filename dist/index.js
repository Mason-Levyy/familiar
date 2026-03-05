"use strict";
const node_path_1 = require("node:path");
const typebox_1 = require("@sinclair/typebox");
const addContact_1 = require("./tools/addContact");
const updateContact_1 = require("./tools/updateContact");
const findContact_1 = require("./tools/findContact");
const listContacts_1 = require("./tools/listContacts");
const logInteraction_1 = require("./tools/logInteraction");
const searchByIndustry_1 = require("./tools/searchByIndustry");
const getUpcomingFollowups_1 = require("./tools/getUpcomingFollowups");
const getUpcomingBirthdays_1 = require("./tools/getUpcomingBirthdays");
const addSchemaColumn_1 = require("./tools/addSchemaColumn");
const addTag_1 = require("./tools/addTag");
const findByTag_1 = require("./tools/findByTag");
const proposeSelfImprovement_1 = require("./tools/proposeSelfImprovement");
function toolResult(data) {
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
}
function registerCrmTools(api) {
    const projectRoot = (0, node_path_1.resolve)(__dirname, "..");
    const databasePath = api.pluginConfig?.dbPath
        ?? process.env.CRM_DB_PATH
        ?? (0, node_path_1.resolve)(projectRoot, "db", "crm.db");
    api.registerTool({
        name: "crm_add_contact",
        description: "Add a new contact to the CRM database.",
        parameters: typebox_1.Type.Object({
            name: typebox_1.Type.String({ description: "Full name" }),
            tier: typebox_1.Type.Union([
                typebox_1.Type.Literal("vip"),
                typebox_1.Type.Literal("acquaintance"),
                typebox_1.Type.Literal("broader"),
            ]),
            email: typebox_1.Type.Optional(typebox_1.Type.String()),
            phone: typebox_1.Type.Optional(typebox_1.Type.String()),
            location: typebox_1.Type.Optional(typebox_1.Type.String({ description: "City / state" })),
            company: typebox_1.Type.Optional(typebox_1.Type.String()),
            industry: typebox_1.Type.Optional(typebox_1.Type.String()),
            role: typebox_1.Type.Optional(typebox_1.Type.String({ description: "Job title" })),
            birthday: typebox_1.Type.Optional(typebox_1.Type.String({ description: "YYYY-MM-DD" })),
            how_met: typebox_1.Type.Optional(typebox_1.Type.String()),
            notes: typebox_1.Type.Optional(typebox_1.Type.String()),
            next_followup: typebox_1.Type.Optional(typebox_1.Type.String({ description: "YYYY-MM-DD — auto-calculated if omitted" })),
        }),
        async execute(_id, params) {
            return toolResult((0, addContact_1.addContact)(databasePath, params));
        },
    });
    api.registerTool({
        name: "crm_update_contact",
        description: "Update one or more fields on an existing contact.",
        parameters: typebox_1.Type.Object({
            id: typebox_1.Type.Number({ description: "Contact ID" }),
            fields: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Unknown(), {
                description: "Dict of column names to new values",
            }),
        }),
        async execute(_id, params) {
            return toolResult((0, updateContact_1.updateContact)(databasePath, params));
        },
    });
    api.registerTool({
        name: "crm_find_contact",
        description: "Search for contacts by name, company, or notes. Returns up to 5 matches with recent interactions.",
        parameters: typebox_1.Type.Object({
            query: typebox_1.Type.String({ description: "Search term" }),
        }),
        async execute(_id, params) {
            return toolResult((0, findContact_1.findContact)(databasePath, params));
        },
    });
    api.registerTool({
        name: "crm_list_contacts",
        description: "List contacts, optionally filtered by tier.",
        parameters: typebox_1.Type.Object({
            tier: typebox_1.Type.Optional(typebox_1.Type.Union([
                typebox_1.Type.Literal("vip"),
                typebox_1.Type.Literal("acquaintance"),
                typebox_1.Type.Literal("broader"),
            ])),
            limit: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 20 })),
        }),
        async execute(_id, params) {
            return toolResult((0, listContacts_1.listContacts)(databasePath, params));
        },
    });
    api.registerTool({
        name: "crm_log_interaction",
        description: "Log a touchpoint with a contact. Updates last_contact and resets next_followup.",
        parameters: typebox_1.Type.Object({
            contact_id: typebox_1.Type.Number(),
            type: typebox_1.Type.Union([
                typebox_1.Type.Literal("text"),
                typebox_1.Type.Literal("email"),
                typebox_1.Type.Literal("call"),
                typebox_1.Type.Literal("coffee"),
                typebox_1.Type.Literal("linkedin"),
                typebox_1.Type.Literal("event"),
                typebox_1.Type.Literal("other"),
            ]),
            summary: typebox_1.Type.String({ description: "What was discussed" }),
            date: typebox_1.Type.Optional(typebox_1.Type.String({ description: "YYYY-MM-DD — defaults to today" })),
        }),
        async execute(_id, params) {
            return toolResult((0, logInteraction_1.logInteraction)(databasePath, params));
        },
    });
    api.registerTool({
        name: "crm_search_by_industry",
        description: "Find contacts by industry or company.",
        parameters: typebox_1.Type.Object({
            industry: typebox_1.Type.Optional(typebox_1.Type.String()),
            company: typebox_1.Type.Optional(typebox_1.Type.String()),
        }),
        async execute(_id, params) {
            return toolResult((0, searchByIndustry_1.searchByIndustry)(databasePath, params));
        },
    });
    api.registerTool({
        name: "crm_get_upcoming_followups",
        description: "Return contacts whose next_followup date falls within N days from today.",
        parameters: typebox_1.Type.Object({
            days: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 7 })),
        }),
        async execute(_id, params) {
            return toolResult((0, getUpcomingFollowups_1.getUpcomingFollowups)(databasePath, params));
        },
    });
    api.registerTool({
        name: "crm_get_upcoming_birthdays",
        description: "Return contacts with birthdays in the next N days.",
        parameters: typebox_1.Type.Object({
            days: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 14 })),
        }),
        async execute(_id, params) {
            return toolResult((0, getUpcomingBirthdays_1.getUpcomingBirthdays)(databasePath, params));
        },
    });
    api.registerTool({
        name: "crm_add_schema_column",
        description: "Dynamically add a new column to a CRM table so new data can be tracked.",
        parameters: typebox_1.Type.Object({
            table_name: typebox_1.Type.Optional(typebox_1.Type.String({ default: "contacts" })),
            column_name: typebox_1.Type.String(),
            column_type: typebox_1.Type.Optional(typebox_1.Type.String({ default: "TEXT" })),
            description: typebox_1.Type.Optional(typebox_1.Type.String()),
        }),
        async execute(_id, params) {
            return toolResult((0, addSchemaColumn_1.addSchemaColumn)(databasePath, params));
        },
    });
    api.registerTool({
        name: "crm_add_tag",
        description: "Tag a contact with a label.",
        parameters: typebox_1.Type.Object({
            contact_id: typebox_1.Type.Number(),
            tag_name: typebox_1.Type.String(),
        }),
        async execute(_id, params) {
            return toolResult((0, addTag_1.addTag)(databasePath, params));
        },
    });
    api.registerTool({
        name: "crm_find_by_tag",
        description: "Find all contacts with a given tag.",
        parameters: typebox_1.Type.Object({
            tag_name: typebox_1.Type.String(),
        }),
        async execute(_id, params) {
            return toolResult((0, findByTag_1.findByTag)(databasePath, params));
        },
    });
    api.registerTool({
        name: "bot_propose_change",
        description: "Propose an improvement to this bot's own codebase. Creates a git branch, writes the changed files, commits, pushes, and opens a GitHub PR. Returns the PR URL. Never pushes to main or uses --force.",
        parameters: typebox_1.Type.Object({
            branch: typebox_1.Type.String({
                description: "Feature branch name, e.g. 'feat/add-bulk-tag-tool'. Cannot be main or master.",
            }),
            changes: typebox_1.Type.Array(typebox_1.Type.Object({
                path: typebox_1.Type.String({ description: "Repo-relative file path, e.g. 'src/tools/foo.ts'" }),
                content: typebox_1.Type.String({ description: "Full file content" }),
            }), { description: "Files to create or overwrite" }),
            commit_message: typebox_1.Type.String(),
            pr_title: typebox_1.Type.String(),
            pr_body: typebox_1.Type.String({ description: "Markdown body for the PR description" }),
        }),
        async execute(_id, params) {
            return toolResult((0, proposeSelfImprovement_1.proposeSelfImprovement)((0, node_path_1.resolve)(__dirname, ".."), params));
        },
    });
}
module.exports = registerCrmTools;
