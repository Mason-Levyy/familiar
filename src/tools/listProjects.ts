import { openDatabase } from "../db";

interface ListProjectsParams {
  status?: string;
  limit?: number;
}

export function listProjects(databasePath: string, params: ListProjectsParams) {
  const database = openDatabase(databasePath);
  try {
    const limit = params.limit ?? 20;
    let query = "SELECT * FROM projects";
    const args: (string | number)[] = [];

    if (params.status) {
      query += " WHERE status = ?";
      args.push(params.status);
    }

    query += " ORDER BY updated_at DESC LIMIT ?";
    args.push(limit);

    const rows = database.prepare(query).all(...args);
    return { success: true, count: rows.length, projects: rows };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
