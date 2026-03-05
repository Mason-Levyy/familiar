import { openDatabase, todayIso, followupDate } from "../db";

interface LogInteractionParams {
  contact_id: number;
  type: string;
  summary: string;
  date?: string;
}

export function logInteraction(databasePath: string, params: LogInteractionParams) {
  const interactionDate = params.date ?? todayIso();
  const database = openDatabase(databasePath);
  try {
    database.prepare(
      "INSERT INTO interactions (contact_id, type, summary, date) VALUES (?, ?, ?, ?)"
    ).run(params.contact_id, params.type, params.summary, interactionDate);

    const row = database.prepare(
      "SELECT tier FROM contacts WHERE id = ?"
    ).get(params.contact_id) as { tier: string } | undefined;

    const tier = row?.tier ?? "broader";
    const nextFollowup = followupDate(tier);

    database.prepare(
      "UPDATE contacts SET last_contact = ?, next_followup = ? WHERE id = ?"
    ).run(interactionDate, nextFollowup, params.contact_id);

    return {
      success: true,
      message: `Logged interaction, next follow-up: ${nextFollowup}`,
      next_followup: nextFollowup,
    };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
