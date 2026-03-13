import { openDatabase, type Tier } from "../db";

interface ListContactsParams {
  tier?: Tier;
  limit?: number;
}

export function listContacts(databasePath: string, params: ListContactsParams) {
  const limit = params.limit ?? 20;
  const database = openDatabase(databasePath);
  try {
    let rows: Record<string, unknown>[];
    if (params.tier) {
      rows = database.prepare(`
        SELECT id, name, tier, company, role, last_contact, next_followup
        FROM contacts WHERE tier = ? ORDER BY name LIMIT ?
      `).all(params.tier, limit) as Record<string, unknown>[];
    } else {
      rows = database.prepare(`
        SELECT id, name, tier, company, role, last_contact, next_followup
        FROM contacts ORDER BY tier, name LIMIT ?
      `).all(limit) as Record<string, unknown>[];
    }
    return { success: true, count: rows.length, contacts: rows };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
