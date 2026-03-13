import { resolve } from "node:path";
import { Type } from "@sinclair/typebox";
import { addContact } from "./tools/addContact";
import { updateContact } from "./tools/updateContact";
import { findContact } from "./tools/findContact";
import { listContacts } from "./tools/listContacts";
import { logInteraction } from "./tools/logInteraction";
import { searchByIndustry } from "./tools/searchByIndustry";
import { getUpcomingFollowups } from "./tools/getUpcomingFollowups";
import { getUpcomingBirthdays } from "./tools/getUpcomingBirthdays";
import { addSchemaColumn } from "./tools/addSchemaColumn";
import { addTag } from "./tools/addTag";
import { findByTag } from "./tools/findByTag";
import { proposeSelfImprovement } from "./tools/proposeSelfImprovement";
import { createProject } from "./tools/createProject";
import { listProjects } from "./tools/listProjects";
import { addTask } from "./tools/addTask";
import { updateTask } from "./tools/updateTask";
import { listTasks } from "./tools/listTasks";
import { logProjectEntry } from "./tools/logProjectEntry";
import { getProjectSummary } from "./tools/getProjectSummary";

interface OpenClawApi {
  pluginConfig?: { dbPath?: string };
  registerTool(config: {
    name: string;
    description: string;
    parameters: unknown;
    execute: (id: string, params: Record<string, unknown>) => Promise<{
      content: Array<{ type: string; text: string }>;
    }>;
  }, options?: { optional?: boolean }): void;
}

function toolResult(data: Record<string, unknown>) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

function wrapExecute<P>(
  name: string,
  fn: (params: P) => Record<string, unknown>
): (id: string, params: Record<string, unknown>) => Promise<ReturnType<typeof toolResult>> {
  return async (_id, params) => {
    console.log(`[familiar:${name}] invoked params=${JSON.stringify(params)}`);
    try {
      const result = fn(params as P);
      console.log(`[familiar:${name}] ok result=${JSON.stringify(result)}`);
      return toolResult(result);
    } catch (err) {
      console.error(`[familiar:${name}] error message=${(err as Error).message}`);
      console.error(`[familiar:${name}] stack=${(err as Error).stack}`);
      throw err;
    }
  };
}

function registerCrmTools(api: OpenClawApi) {
  const projectRoot = resolve(__dirname, "..");
  const databasePath: string =
    api.pluginConfig?.dbPath
    ?? process.env.CRM_DB_PATH
    ?? resolve(projectRoot, "db", "familiar.db");

  console.log(`[familiar] plugin loaded dbPath=${databasePath}`);

  api.registerTool({
    name: "crm_add_contact",
    description: "Add a new contact to the CRM database.",
    parameters: Type.Object({
      name: Type.String({ description: "Full name" }),
      tier: Type.Union([
        Type.Literal("vip"),
        Type.Literal("acquaintance"),
        Type.Literal("broader"),
      ]),
      email: Type.Optional(Type.String()),
      phone: Type.Optional(Type.String()),
      location: Type.Optional(Type.String({ description: "City / state" })),
      company: Type.Optional(Type.String()),
      industry: Type.Optional(Type.String()),
      role: Type.Optional(Type.String({ description: "Job title" })),
      birthday: Type.Optional(Type.String({ description: "YYYY-MM-DD" })),
      how_met: Type.Optional(Type.String()),
      notes: Type.Optional(Type.String()),
      next_followup: Type.Optional(
        Type.String({ description: "YYYY-MM-DD — auto-calculated if omitted" })
      ),
    }),
    execute: wrapExecute("crm_add_contact", (params: Parameters<typeof addContact>[1]) => addContact(databasePath, params)),
  });

  api.registerTool({
    name: "crm_update_contact",
    description: "Update one or more fields on an existing contact.",
    parameters: Type.Object({
      id: Type.Number({ description: "Contact ID" }),
      fields: Type.Record(Type.String(), Type.Unknown(), {
        description: "Dict of column names to new values",
      }),
    }),
    execute: wrapExecute("crm_update_contact", (params: Parameters<typeof updateContact>[1]) => updateContact(databasePath, params)),
  });

  api.registerTool({
    name: "crm_find_contact",
    description:
      "Search for contacts by name, company, or notes. Returns up to 5 matches with recent interactions.",
    parameters: Type.Object({
      query: Type.String({ description: "Search term" }),
    }),
    execute: wrapExecute("crm_find_contact", (params: Parameters<typeof findContact>[1]) => findContact(databasePath, params)),
  });

  api.registerTool({
    name: "crm_list_contacts",
    description: "List contacts, optionally filtered by tier.",
    parameters: Type.Object({
      tier: Type.Optional(
        Type.Union([
          Type.Literal("vip"),
          Type.Literal("acquaintance"),
          Type.Literal("broader"),
        ])
      ),
      limit: Type.Optional(Type.Number({ default: 20 })),
    }),
    execute: wrapExecute("crm_list_contacts", (params: Parameters<typeof listContacts>[1]) => listContacts(databasePath, params)),
  });

  api.registerTool({
    name: "crm_log_interaction",
    description:
      "Log a touchpoint with a contact. Updates last_contact and resets next_followup.",
    parameters: Type.Object({
      contact_id: Type.Number(),
      type: Type.Union([
        Type.Literal("text"),
        Type.Literal("email"),
        Type.Literal("call"),
        Type.Literal("coffee"),
        Type.Literal("linkedin"),
        Type.Literal("event"),
        Type.Literal("other"),
      ]),
      summary: Type.String({ description: "What was discussed" }),
      date: Type.Optional(
        Type.String({ description: "YYYY-MM-DD — defaults to today" })
      ),
    }),
    execute: wrapExecute("crm_log_interaction", (params: Parameters<typeof logInteraction>[1]) => logInteraction(databasePath, params)),
  });

  api.registerTool({
    name: "crm_search_by_industry",
    description: "Find contacts by industry or company.",
    parameters: Type.Object({
      industry: Type.Optional(Type.String()),
      company: Type.Optional(Type.String()),
    }),
    execute: wrapExecute("crm_search_by_industry", (params: Parameters<typeof searchByIndustry>[1]) => searchByIndustry(databasePath, params)),
  });

  api.registerTool({
    name: "crm_get_upcoming_followups",
    description:
      "Return contacts whose next_followup date falls within N days from today.",
    parameters: Type.Object({
      days: Type.Optional(Type.Number({ default: 7 })),
    }),
    execute: wrapExecute("crm_get_upcoming_followups", (params: Parameters<typeof getUpcomingFollowups>[1]) => getUpcomingFollowups(databasePath, params)),
  });

  api.registerTool({
    name: "crm_get_upcoming_birthdays",
    description: "Return contacts with birthdays in the next N days.",
    parameters: Type.Object({
      days: Type.Optional(Type.Number({ default: 14 })),
    }),
    execute: wrapExecute("crm_get_upcoming_birthdays", (params: Parameters<typeof getUpcomingBirthdays>[1]) => getUpcomingBirthdays(databasePath, params)),
  });

  api.registerTool({
    name: "crm_add_schema_column",
    description:
      "Dynamically add a new column to a CRM table so new data can be tracked.",
    parameters: Type.Object({
      table_name: Type.Optional(Type.String({ default: "contacts" })),
      column_name: Type.String(),
      column_type: Type.Optional(Type.String({ default: "TEXT" })),
      description: Type.Optional(Type.String()),
    }),
    execute: wrapExecute("crm_add_schema_column", (params: Parameters<typeof addSchemaColumn>[1]) => addSchemaColumn(databasePath, params)),
  });

  api.registerTool({
    name: "crm_add_tag",
    description: "Tag a contact with a label.",
    parameters: Type.Object({
      contact_id: Type.Number(),
      tag_name: Type.String(),
    }),
    execute: wrapExecute("crm_add_tag", (params: Parameters<typeof addTag>[1]) => addTag(databasePath, params)),
  });

  api.registerTool({
    name: "crm_find_by_tag",
    description: "Find all contacts with a given tag.",
    parameters: Type.Object({
      tag_name: Type.String(),
    }),
    execute: wrapExecute("crm_find_by_tag", (params: Parameters<typeof findByTag>[1]) => findByTag(databasePath, params)),
  });

  api.registerTool({
    name: "bot_propose_change",
    description:
      "Propose an improvement to this bot's own codebase. Creates a git branch, writes the changed files, commits, pushes, and opens a GitHub PR. Returns the PR URL. Never pushes to main or uses --force.",
    parameters: Type.Object({
      branch: Type.String({
        description: "Feature branch name, e.g. 'feat/add-bulk-tag-tool'. Cannot be main or master.",
      }),
      changes: Type.Array(
        Type.Object({
          path: Type.String({ description: "Repo-relative file path, e.g. 'src/tools/foo.ts'" }),
          content: Type.String({ description: "Full file content" }),
        }),
        { description: "Files to create or overwrite" }
      ),
      commit_message: Type.String(),
      pr_title: Type.String(),
      pr_body: Type.String({ description: "Markdown body for the PR description" }),
    }),
    execute: wrapExecute("bot_propose_change", (params: Parameters<typeof proposeSelfImprovement>[1]) =>
      proposeSelfImprovement(resolve(__dirname, ".."), params) as Record<string, unknown>
    ),
  });

  // ── Project Management Tools ──────────────────────────────

  api.registerTool({
    name: "pm_create_project",
    description: "Create a new project to track.",
    parameters: Type.Object({
      name: Type.String({ description: "Project display name" }),
      slug: Type.String({ description: "URL-safe unique identifier, e.g. 'badami-diligence'" }),
      status: Type.Optional(
        Type.Union([
          Type.Literal("active"),
          Type.Literal("paused"),
          Type.Literal("completed"),
          Type.Literal("archived"),
        ])
      ),
      goal: Type.Optional(Type.String({ description: "What the project aims to accomplish" })),
      role: Type.Optional(Type.String({ description: "Your role on the project" })),
      organization: Type.Optional(Type.String({ description: "Client or organization" })),
      start_date: Type.Optional(Type.String({ description: "YYYY-MM-DD — defaults to today" })),
      end_date: Type.Optional(Type.String({ description: "YYYY-MM-DD" })),
      checkin_cadence_hours: Type.Optional(Type.Number({ default: 48 })),
      notes: Type.Optional(Type.String()),
    }),
    execute: wrapExecute("pm_create_project", (params: Parameters<typeof createProject>[1]) => createProject(databasePath, params)),
  });

  api.registerTool({
    name: "pm_list_projects",
    description: "List projects, optionally filtered by status.",
    parameters: Type.Object({
      status: Type.Optional(
        Type.Union([
          Type.Literal("active"),
          Type.Literal("paused"),
          Type.Literal("completed"),
          Type.Literal("archived"),
        ])
      ),
      limit: Type.Optional(Type.Number({ default: 20 })),
    }),
    execute: wrapExecute("pm_list_projects", (params: Parameters<typeof listProjects>[1]) => listProjects(databasePath, params)),
  });

  api.registerTool({
    name: "pm_add_task",
    description: "Add a task to a project.",
    parameters: Type.Object({
      project_id: Type.Number({ description: "Project ID" }),
      title: Type.String({ description: "Task description" }),
      status: Type.Optional(
        Type.Union([
          Type.Literal("todo"),
          Type.Literal("in_progress"),
          Type.Literal("done"),
          Type.Literal("blocked"),
        ])
      ),
      priority: Type.Optional(
        Type.Union([
          Type.Literal("low"),
          Type.Literal("medium"),
          Type.Literal("high"),
          Type.Literal("urgent"),
        ])
      ),
      due_date: Type.Optional(Type.String({ description: "YYYY-MM-DD" })),
      notes: Type.Optional(Type.String()),
    }),
    execute: wrapExecute("pm_add_task", (params: Parameters<typeof addTask>[1]) => addTask(databasePath, params)),
  });

  api.registerTool({
    name: "pm_update_task",
    description: "Update one or more fields on an existing task. Setting status to 'done' auto-fills completed_at.",
    parameters: Type.Object({
      id: Type.Number({ description: "Task ID" }),
      fields: Type.Record(Type.String(), Type.Unknown(), {
        description: "Dict of field names to new values (status, priority, due_date, notes, title)",
      }),
    }),
    execute: wrapExecute("pm_update_task", (params: Parameters<typeof updateTask>[1]) => updateTask(databasePath, params)),
  });

  api.registerTool({
    name: "pm_list_tasks",
    description: "List tasks for a project, optionally filtered by status. Ordered by priority (urgent first).",
    parameters: Type.Object({
      project_id: Type.Number({ description: "Project ID" }),
      status: Type.Optional(
        Type.Union([
          Type.Literal("todo"),
          Type.Literal("in_progress"),
          Type.Literal("done"),
          Type.Literal("blocked"),
        ])
      ),
      limit: Type.Optional(Type.Number({ default: 50 })),
    }),
    execute: wrapExecute("pm_list_tasks", (params: Parameters<typeof listTasks>[1]) => listTasks(databasePath, params)),
  });

  api.registerTool({
    name: "pm_log_entry",
    description: "Log a dated entry to a project with summary and tags.",
    parameters: Type.Object({
      project_id: Type.Number({ description: "Project ID" }),
      summary: Type.String({ description: "What happened" }),
      tags: Type.Optional(Type.String({ description: "Comma-separated tags, e.g. 'meeting,decision'" })),
      date: Type.Optional(Type.String({ description: "YYYY-MM-DD — defaults to today" })),
    }),
    execute: wrapExecute("pm_log_entry", (params: Parameters<typeof logProjectEntry>[1]) => logProjectEntry(databasePath, params)),
  });

  api.registerTool({
    name: "pm_get_project_summary",
    description: "Get a full project summary: details, open tasks, overdue tasks, completed count, and recent log entries.",
    parameters: Type.Object({
      project_id: Type.Number({ description: "Project ID" }),
      log_limit: Type.Optional(Type.Number({ default: 10, description: "Max recent log entries to return" })),
    }),
    execute: wrapExecute("pm_get_project_summary", (params: Parameters<typeof getProjectSummary>[1]) => getProjectSummary(databasePath, params)),
  });
}

export = registerCrmTools;
