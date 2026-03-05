import { openDatabase } from "../db";

import type { SQLInputValue } from "node:sqlite";

interface UpdateContactParams {
  id: number;
  fields: Record<string, unknown>;
}

export function updateContact(databasePath: string, params: UpdateContactParams) {
  if (!params.fields || Object.keys(params.fields).length === 0) {
    return { success: false, error: "No fields to update" };
  }

  const columns = Object.keys(params.fields);
  const setClause = columns.map((column) => `${column} = ?`).join(", ");
  const values = [
    ...columns.map((column) => params.fields[column] as SQLInputValue),
    params.id,
  ];

  const database = openDatabase(databasePath);
  try {
    database.prepare(`UPDATE contacts SET ${setClause} WHERE id = ?`).run(...values);
    return { success: true, message: `Updated contact ${params.id}` };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
