import { openDatabase, type TaskStatus } from "../db";

interface ListTasksParams {
  project_id: number;
  status?: TaskStatus;
  limit?: number;
}

export function listTasks(databasePath: string, params: ListTasksParams) {
  const database = openDatabase(databasePath);
  try {
    const limit = params.limit ?? 50;
    let query = "SELECT * FROM tasks WHERE project_id = ?";
    const args: (string | number)[] = [params.project_id];

    if (params.status) {
      query += " AND status = ?";
      args.push(params.status);
    }

    query += [
      " ORDER BY",
      " CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,",
      " created_at DESC LIMIT ?",
    ].join("");
    args.push(limit);

    const rows = database.prepare(query).all(...args);
    return { success: true, count: rows.length, tasks: rows };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
