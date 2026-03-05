import { openDatabase } from "../db";

interface FindByTagParams {
  tag_name: string;
}

export function findByTag(databasePath: string, params: FindByTagParams) {
  const database = openDatabase(databasePath);
  try {
    const rows = database.prepare(`
      SELECT c.id, c.name, c.tier, c.company, c.role, c.last_contact
      FROM contacts c
      JOIN contact_tags ct ON c.id = ct.contact_id
      JOIN tags t ON ct.tag_id = t.id
      WHERE t.name LIKE ?
      ORDER BY c.tier
    `).all(`%${params.tag_name}%`) as Record<string, unknown>[];

    return { success: true, count: rows.length, contacts: rows };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
