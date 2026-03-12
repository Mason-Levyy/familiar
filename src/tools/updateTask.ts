import { openDatabase, todayIso } from "../db";

interface UpdateTaskParams {
  id: number;
  fields: Record<string, unknown>;
}

export function updateTask(databasePath: string, params: UpdateTaskParams) {
  const database = openDatabase(databasePath);
  try {
    const entries = Object.entries(params.fields);
    if (entries.length === 0) {
      return { success: false, error: "No fields to update" };
    }

    // Auto-fill completed_at when status changes to done
    if (params.fields.status === "done" && !params.fields.completed_at) {
      entries.push(["completed_at", new Date().toISOString()]);
    }

    const setClauses = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([, value]) => value as string | number | null);

    database.prepare(
      `UPDATE tasks SET ${setClauses} WHERE id = ?`
    ).run(...values, params.id);

    const updated = database.prepare("SELECT * FROM tasks WHERE id = ?").get(params.id);
    return {
      success: true,
      message: `Updated task ${params.id}`,
      task: updated,
    };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
