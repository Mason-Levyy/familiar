import { openDatabase, todayIso } from "../db";

interface CreateProjectParams {
  name: string;
  slug: string;
  status?: string;
  goal?: string;
  role?: string;
  organization?: string;
  start_date?: string;
  end_date?: string;
  checkin_cadence_hours?: number;
  notes?: string;
}

export function createProject(databasePath: string, params: CreateProjectParams) {
  const database = openDatabase(databasePath);
  try {
    const statement = database.prepare(`
      INSERT INTO projects
        (name, slug, status, goal, role, organization,
         start_date, end_date, checkin_cadence_hours, notes)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = statement.run(
      params.name,
      params.slug,
      params.status ?? "active",
      params.goal ?? null,
      params.role ?? null,
      params.organization ?? null,
      params.start_date ?? todayIso(),
      params.end_date ?? null,
      params.checkin_cadence_hours ?? 48,
      params.notes ?? null,
    );
    return {
      success: true,
      id: Number(result.lastInsertRowid),
      message: `Created project "${params.name}" (${params.slug})`,
    };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
