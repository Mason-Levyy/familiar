import { openDatabase } from "../db";

interface GetUpcomingFollowupsParams {
  days?: number;
}

export function getUpcomingFollowups(databasePath: string, params: GetUpcomingFollowupsParams) {
  const days = params.days ?? 7;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  const cutoffIso = cutoff.toISOString().split("T")[0];

  const database = openDatabase(databasePath);
  try {
    const rows = database.prepare(`
      SELECT id, name, tier, last_contact, next_followup, notes
      FROM contacts
      WHERE next_followup <= ?
      ORDER BY (tier = 'vip') DESC, next_followup ASC
    `).all(cutoffIso) as Record<string, unknown>[];

    return { success: true, count: rows.length, contacts: rows };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
