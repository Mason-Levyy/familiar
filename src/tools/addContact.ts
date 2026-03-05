import { openDatabase, followupDate } from "../db";

interface AddContactParams {
  name: string;
  tier: string;
  email?: string;
  phone?: string;
  location?: string;
  company?: string;
  industry?: string;
  role?: string;
  birthday?: string;
  how_met?: string;
  notes?: string;
  next_followup?: string;
}

export function addContact(databasePath: string, params: AddContactParams) {
  const computedFollowup = params.next_followup ?? followupDate(params.tier);
  const database = openDatabase(databasePath);
  try {
    const statement = database.prepare(`
      INSERT INTO contacts
        (name, tier, email, phone, location, company, industry,
         role, birthday, how_met, notes, next_followup)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = statement.run(
      params.name,
      params.tier,
      params.email ?? null,
      params.phone ?? null,
      params.location ?? null,
      params.company ?? null,
      params.industry ?? null,
      params.role ?? null,
      params.birthday ?? null,
      params.how_met ?? null,
      params.notes ?? null,
      computedFollowup,
    );
    return {
      success: true,
      id: Number(result.lastInsertRowid),
      message: `Added ${params.name} (${params.tier})`,
      next_followup: computedFollowup,
    };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
