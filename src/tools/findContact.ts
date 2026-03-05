import { openDatabase } from "../db";

interface FindContactParams {
  query: string;
}

export function findContact(databasePath: string, params: FindContactParams) {
  const pattern = `%${params.query}%`;
  const database = openDatabase(databasePath);
  try {
    const contacts = database.prepare(`
      SELECT * FROM contacts
      WHERE name LIKE ? OR company LIKE ? OR notes LIKE ?
      ORDER BY (tier = 'vip') DESC, name ASC
      LIMIT 5
    `).all(pattern, pattern, pattern) as Record<string, unknown>[];

    const results = contacts.map((contact) => {
      const contactId = contact.id as number;
      const interactions = database.prepare(`
        SELECT type, summary, date FROM interactions
        WHERE contact_id = ? ORDER BY date DESC LIMIT 3
      `).all(contactId) as Record<string, unknown>[];
      return { ...contact, recent_interactions: interactions };
    });

    return { success: true, results };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
