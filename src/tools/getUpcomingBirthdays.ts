import { openDatabase, formatMonthDay } from "../db";

interface GetUpcomingBirthdaysParams {
  days?: number;
}

export function getUpcomingBirthdays(databasePath: string, params: GetUpcomingBirthdaysParams) {
  const days = params.days ?? 14;
  const today = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  const todayMonthDay = formatMonthDay(today);
  const cutoffMonthDay = formatMonthDay(cutoff);

  const database = openDatabase(databasePath);
  try {
    let rows: Record<string, unknown>[];

    if (todayMonthDay <= cutoffMonthDay) {
      rows = database.prepare(`
        SELECT id, name, tier, birthday, notes
        FROM contacts
        WHERE birthday IS NOT NULL
          AND strftime('%m-%d', birthday) BETWEEN ? AND ?
        ORDER BY strftime('%m-%d', birthday)
      `).all(todayMonthDay, cutoffMonthDay) as Record<string, unknown>[];
    } else {
      rows = database.prepare(`
        SELECT id, name, tier, birthday, notes
        FROM contacts
        WHERE birthday IS NOT NULL
          AND (strftime('%m-%d', birthday) >= ? OR strftime('%m-%d', birthday) <= ?)
        ORDER BY strftime('%m-%d', birthday)
      `).all(todayMonthDay, cutoffMonthDay) as Record<string, unknown>[];
    }

    return { success: true, count: rows.length, contacts: rows };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
