import { openDatabase } from "../db";

interface AddTagParams {
  contact_id: number;
  tag_name: string;
}

export function addTag(databasePath: string, params: AddTagParams) {
  const database = openDatabase(databasePath);
  try {
    database.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)").run(params.tag_name);

    const tagRow = database.prepare(
      "SELECT id FROM tags WHERE name = ?"
    ).get(params.tag_name) as { id: number };

    database.prepare(
      "INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)"
    ).run(params.contact_id, tagRow.id);

    return {
      success: true,
      message: `Tagged contact ${params.contact_id} with '${params.tag_name}'`,
    };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
