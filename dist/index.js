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
const createProject_1 = require("./tools/createProject");
const listProjects_1 = require("./tools/listProjects");
const addTask_1 = require("./tools/addTask");
const updateTask_1 = require("./tools/updateTask");
const listTasks_1 = require("./tools/listTasks");
const logProjectEntry_1 = require("./tools/logProjectEntry");
const getProjectSummary_1 = require("./tools/getProjectSummary");
function toolResult(data) {
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
}
function wrapExecute(name, fn) {
    return async (_id, params) => {
        console.log(`[familiar:${name}] invoked params=${JSON.stringify(params)}`);
        try {
            const result = fn(params);
            console.log(`[familiar:${name}] ok result=${JSON.stringify(result)}`);
            return toolResult(result);
        }
        catch (err) {
            console.error(`[familiar:${name}] error message=${err.message}`);
            console.error(`[familiar:${name}] stack=${err.stack}`);
            throw err;
        }
    };
}
function registerCrmTools(api) {
    const projectRoot = (0, node_path_1.resolve)(__dirname, "..");
    const databasePath = api.pluginConfig?.dbPath
        ?? process.env.CRM_DB_PATH
        ?? (0, node_path_1.resolve)(projectRoot, "db", "familiar.db");
    console.log(`[familiar] plugin loaded dbPath=${databasePath}`);
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
        execute: wrapExecute("crm_add_contact", (params) => (0, addContact_1.addContact)(databasePath, params)),
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
        execute: wrapExecute("crm_update_contact", (params) => (0, updateContact_1.updateContact)(databasePath, params)),
    });
    api.registerTool({
        name: "crm_find_contact",
        description: "Search for contacts by name, company, or notes. Returns up to 5 matches with recent interactions.",
        parameters: typebox_1.Type.Object({
            query: typebox_1.Type.String({ description: "Search term" }),
        }),
        execute: wrapExecute("crm_find_contact", (params) => (0, findContact_1.findContact)(databasePath, params)),
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
        execute: wrapExecute("crm_list_contacts", (params) => (0, listContacts_1.listContacts)(databasePath, params)),
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
        execute: wrapExecute("crm_log_interaction", (params) => (0, logInteraction_1.logInteraction)(databasePath, params)),
    });
    api.registerTool({
        name: "crm_search_by_industry",
        description: "Find contacts by industry or company.",
        parameters: typebox_1.Type.Object({
            industry: typebox_1.Type.Optional(typebox_1.Type.String()),
            company: typebox_1.Type.Optional(typebox_1.Type.String()),
        }),
        execute: wrapExecute("crm_search_by_industry", (params) => (0, searchByIndustry_1.searchByIndustry)(databasePath, params)),
    });
    api.registerTool({
        name: "crm_get_upcoming_followups",
        description: "Return contacts whose next_followup date falls within N days from today.",
        parameters: typebox_1.Type.Object({
            days: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 7 })),
        }),
        execute: wrapExecute("crm_get_upcoming_followups", (params) => (0, getUpcomingFollowups_1.getUpcomingFollowups)(databasePath, params)),
    });
    api.registerTool({
        name: "crm_get_upcoming_birthdays",
        description: "Return contacts with birthdays in the next N days.",
        parameters: typebox_1.Type.Object({
            days: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 14 })),
        }),
        execute: wrapExecute("crm_get_upcoming_birthdays", (params) => (0, getUpcomingBirthdays_1.getUpcomingBirthdays)(databasePath, params)),
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
        execute: wrapExecute("crm_add_schema_column", (params) => (0, addSchemaColumn_1.addSchemaColumn)(databasePath, params)),
    });
    api.registerTool({
        name: "crm_add_tag",
        description: "Tag a contact with a label.",
        parameters: typebox_1.Type.Object({
            contact_id: typebox_1.Type.Number(),
            tag_name: typebox_1.Type.String(),
        }),
        execute: wrapExecute("crm_add_tag", (params) => (0, addTag_1.addTag)(databasePath, params)),
    });
    api.registerTool({
        name: "crm_find_by_tag",
        description: "Find all contacts with a given tag.",
        parameters: typebox_1.Type.Object({
            tag_name: typebox_1.Type.String(),
        }),
        execute: wrapExecute("crm_find_by_tag", (params) => (0, findByTag_1.findByTag)(databasePath, params)),
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
            console.log(`[familiar:bot_propose_change] invoked params=${JSON.stringify(params)}`);
            try {
                const result = (0, proposeSelfImprovement_1.proposeSelfImprovement)((0, node_path_1.resolve)(__dirname, ".."), params);
                console.log(`[familiar:bot_propose_change] ok result=${JSON.stringify(result)}`);
                return toolResult(result);
            }
            catch (err) {
                console.error(`[familiar:bot_propose_change] error message=${err.message}`);
                console.error(`[familiar:bot_propose_change] stack=${err.stack}`);
                throw err;
            }
        },
    });
    // ── Project Management Tools ──────────────────────────────
    api.registerTool({
        name: "pm_create_project",
        description: "Create a new project to track.",
        parameters: typebox_1.Type.Object({
            name: typebox_1.Type.String({ description: "Project display name" }),
            slug: typebox_1.Type.String({ description: "URL-safe unique identifier, e.g. 'badami-diligence'" }),
            status: typebox_1.Type.Optional(typebox_1.Type.Union([
                typebox_1.Type.Literal("active"),
                typebox_1.Type.Literal("paused"),
                typebox_1.Type.Literal("completed"),
                typebox_1.Type.Literal("archived"),
            ])),
            goal: typebox_1.Type.Optional(typebox_1.Type.String({ description: "What the project aims to accomplish" })),
            role: typebox_1.Type.Optional(typebox_1.Type.String({ description: "Your role on the project" })),
            organization: typebox_1.Type.Optional(typebox_1.Type.String({ description: "Client or organization" })),
            start_date: typebox_1.Type.Optional(typebox_1.Type.String({ description: "YYYY-MM-DD — defaults to today" })),
            end_date: typebox_1.Type.Optional(typebox_1.Type.String({ description: "YYYY-MM-DD" })),
            checkin_cadence_hours: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 48 })),
            notes: typebox_1.Type.Optional(typebox_1.Type.String()),
        }),
        execute: wrapExecute("pm_create_project", (params) => (0, createProject_1.createProject)(databasePath, params)),
    });
    api.registerTool({
        name: "pm_list_projects",
        description: "List projects, optionally filtered by status.",
        parameters: typebox_1.Type.Object({
            status: typebox_1.Type.Optional(typebox_1.Type.Union([
                typebox_1.Type.Literal("active"),
                typebox_1.Type.Literal("paused"),
                typebox_1.Type.Literal("completed"),
                typebox_1.Type.Literal("archived"),
            ])),
            limit: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 20 })),
        }),
        execute: wrapExecute("pm_list_projects", (params) => (0, listProjects_1.listProjects)(databasePath, params)),
    });
    api.registerTool({
        name: "pm_add_task",
        description: "Add a task to a project.",
        parameters: typebox_1.Type.Object({
            project_id: typebox_1.Type.Number({ description: "Project ID" }),
            title: typebox_1.Type.String({ description: "Task description" }),
            status: typebox_1.Type.Optional(typebox_1.Type.Union([
                typebox_1.Type.Literal("todo"),
                typebox_1.Type.Literal("in_progress"),
                typebox_1.Type.Literal("done"),
                typebox_1.Type.Literal("blocked"),
            ])),
            priority: typebox_1.Type.Optional(typebox_1.Type.Union([
                typebox_1.Type.Literal("low"),
                typebox_1.Type.Literal("medium"),
                typebox_1.Type.Literal("high"),
                typebox_1.Type.Literal("urgent"),
            ])),
            due_date: typebox_1.Type.Optional(typebox_1.Type.String({ description: "YYYY-MM-DD" })),
            notes: typebox_1.Type.Optional(typebox_1.Type.String()),
        }),
        execute: wrapExecute("pm_add_task", (params) => (0, addTask_1.addTask)(databasePath, params)),
    });
    api.registerTool({
        name: "pm_update_task",
        description: "Update one or more fields on an existing task. Setting status to 'done' auto-fills completed_at.",
        parameters: typebox_1.Type.Object({
            id: typebox_1.Type.Number({ description: "Task ID" }),
            fields: typebox_1.Type.Record(typebox_1.Type.String(), typebox_1.Type.Unknown(), {
                description: "Dict of field names to new values (status, priority, due_date, notes, title)",
            }),
        }),
        execute: wrapExecute("pm_update_task", (params) => (0, updateTask_1.updateTask)(databasePath, params)),
    });
    api.registerTool({
        name: "pm_list_tasks",
        description: "List tasks for a project, optionally filtered by status. Ordered by priority (urgent first).",
        parameters: typebox_1.Type.Object({
            project_id: typebox_1.Type.Number({ description: "Project ID" }),
            status: typebox_1.Type.Optional(typebox_1.Type.Union([
                typebox_1.Type.Literal("todo"),
                typebox_1.Type.Literal("in_progress"),
                typebox_1.Type.Literal("done"),
                typebox_1.Type.Literal("blocked"),
            ])),
            limit: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 50 })),
        }),
        execute: wrapExecute("pm_list_tasks", (params) => (0, listTasks_1.listTasks)(databasePath, params)),
    });
    api.registerTool({
        name: "pm_log_entry",
        description: "Log a dated entry to a project with summary and tags.",
        parameters: typebox_1.Type.Object({
            project_id: typebox_1.Type.Number({ description: "Project ID" }),
            summary: typebox_1.Type.String({ description: "What happened" }),
            tags: typebox_1.Type.Optional(typebox_1.Type.String({ description: "Comma-separated tags, e.g. 'meeting,decision'" })),
            date: typebox_1.Type.Optional(typebox_1.Type.String({ description: "YYYY-MM-DD — defaults to today" })),
        }),
        execute: wrapExecute("pm_log_entry", (params) => (0, logProjectEntry_1.logProjectEntry)(databasePath, params)),
    });
    api.registerTool({
        name: "pm_get_project_summary",
        description: "Get a full project summary: details, open tasks, overdue tasks, completed count, and recent log entries.",
        parameters: typebox_1.Type.Object({
            project_id: typebox_1.Type.Number({ description: "Project ID" }),
            log_limit: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 10, description: "Max recent log entries to return" })),
        }),
        execute: wrapExecute("pm_get_project_summary", (params) => (0, getProjectSummary_1.getProjectSummary)(databasePath, params)),
    });
}
module.exports = registerCrmTools;
