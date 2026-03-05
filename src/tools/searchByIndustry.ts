import { openDatabase } from "../db";

interface SearchByIndustryParams {
  industry?: string;
  company?: string;
}

export function searchByIndustry(databasePath: string, params: SearchByIndustryParams) {
  if (!params.industry && !params.company) {
    return { success: false, error: "Provide industry or company" };
  }

  const database = openDatabase(databasePath);
  try {
    let rows: Record<string, unknown>[];
    if (params.company) {
      rows = database.prepare(`
        SELECT id, name, tier, role, company, industry, last_contact, notes
        FROM contacts WHERE company LIKE ? ORDER BY tier
      `).all(`%${params.company}%`) as Record<string, unknown>[];
    } else {
      rows = database.prepare(`
        SELECT id, name, tier, role, company, industry, last_contact, notes
        FROM contacts WHERE industry LIKE ? ORDER BY tier
      `).all(`%${params.industry}%`) as Record<string, unknown>[];
    }
    return { success: true, count: rows.length, contacts: rows };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
