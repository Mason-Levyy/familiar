import { openDatabase, todayIso } from "../db";

interface AddTaskParams {
  project_id: number;
  title: string;
  status?: string;
  priority?: string;
  due_date?: string;
  notes?: string;
}

export function addTask(databasePath: string, params: AddTaskParams) {
  const database = openDatabase(databasePath);
  try {
    const statement = database.prepare(`
      INSERT INTO tasks
        (project_id, title, status, priority, due_date, notes)
      VALUES
        (?, ?, ?, ?, ?, ?)
    `);
    const result = statement.run(
      params.project_id,
      params.title,
      params.status ?? "todo",
      params.priority ?? "medium",
      params.due_date ?? null,
      params.notes ?? null,
    );
    return {
      success: true,
      id: Number(result.lastInsertRowid),
      message: `Added task "${params.title}"`,
    };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
