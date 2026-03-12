import { openDatabase, todayIso } from "../db";

interface LogProjectEntryParams {
  project_id: number;
  summary: string;
  tags?: string;
  date?: string;
}

export function logProjectEntry(databasePath: string, params: LogProjectEntryParams) {
  const entryDate = params.date ?? todayIso();
  const database = openDatabase(databasePath);
  try {
    const result = database.prepare(
      "INSERT INTO project_logs (project_id, summary, tags, date) VALUES (?, ?, ?, ?)"
    ).run(params.project_id, params.summary, params.tags ?? null, entryDate);

    return {
      success: true,
      id: Number(result.lastInsertRowid),
      message: `Logged entry for project ${params.project_id}`,
      date: entryDate,
    };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
