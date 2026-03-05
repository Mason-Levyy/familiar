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

function registerCrmTools(api: OpenClawApi) {
  const projectRoot = resolve(__dirname, "..");
  const databasePath: string =
    api.pluginConfig?.dbPath
    ?? process.env.CRM_DB_PATH
    ?? resolve(projectRoot, "db", "crm.db");

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
    async execute(_id: string, params: Record<string, unknown>) {
      return toolResult(addContact(databasePath, params as unknown as Parameters<typeof addContact>[1]));
    },
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
    async execute(_id: string, params: Record<string, unknown>) {
      return toolResult(updateContact(databasePath, params as unknown as Parameters<typeof updateContact>[1]));
    },
  });

  api.registerTool({
    name: "crm_find_contact",
    description:
      "Search for contacts by name, company, or notes. Returns up to 5 matches with recent interactions.",
    parameters: Type.Object({
      query: Type.String({ description: "Search term" }),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      return toolResult(findContact(databasePath, params as unknown as Parameters<typeof findContact>[1]));
    },
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
    async execute(_id: string, params: Record<string, unknown>) {
      return toolResult(listContacts(databasePath, params as unknown as Parameters<typeof listContacts>[1]));
    },
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
    async execute(_id: string, params: Record<string, unknown>) {
      return toolResult(logInteraction(databasePath, params as unknown as Parameters<typeof logInteraction>[1]));
    },
  });

  api.registerTool({
    name: "crm_search_by_industry",
    description: "Find contacts by industry or company.",
    parameters: Type.Object({
      industry: Type.Optional(Type.String()),
      company: Type.Optional(Type.String()),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      return toolResult(searchByIndustry(databasePath, params as unknown as Parameters<typeof searchByIndustry>[1]));
    },
  });

  api.registerTool({
    name: "crm_get_upcoming_followups",
    description:
      "Return contacts whose next_followup date falls within N days from today.",
    parameters: Type.Object({
      days: Type.Optional(Type.Number({ default: 7 })),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      return toolResult(getUpcomingFollowups(databasePath, params as unknown as Parameters<typeof getUpcomingFollowups>[1]));
    },
  });

  api.registerTool({
    name: "crm_get_upcoming_birthdays",
    description: "Return contacts with birthdays in the next N days.",
    parameters: Type.Object({
      days: Type.Optional(Type.Number({ default: 14 })),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      return toolResult(getUpcomingBirthdays(databasePath, params as unknown as Parameters<typeof getUpcomingBirthdays>[1]));
    },
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
    async execute(_id: string, params: Record<string, unknown>) {
      return toolResult(addSchemaColumn(databasePath, params as unknown as Parameters<typeof addSchemaColumn>[1]));
    },
  });

  api.registerTool({
    name: "crm_add_tag",
    description: "Tag a contact with a label.",
    parameters: Type.Object({
      contact_id: Type.Number(),
      tag_name: Type.String(),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      return toolResult(addTag(databasePath, params as unknown as Parameters<typeof addTag>[1]));
    },
  });

  api.registerTool({
    name: "crm_find_by_tag",
    description: "Find all contacts with a given tag.",
    parameters: Type.Object({
      tag_name: Type.String(),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      return toolResult(findByTag(databasePath, params as unknown as Parameters<typeof findByTag>[1]));
    },
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
    async execute(_id: string, params: Record<string, unknown>) {
      return toolResult(
        proposeSelfImprovement(
          resolve(__dirname, ".."),
          params as unknown as Parameters<typeof proposeSelfImprovement>[1]
        )
      );
    },
  });
}

export = registerCrmTools;
