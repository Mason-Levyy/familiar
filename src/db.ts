import { DatabaseSync } from "node:sqlite";

export type Tier = "vip" | "acquaintance" | "broader";
export type InteractionType = "text" | "email" | "call" | "coffee" | "linkedin" | "event" | "other";
export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

const FOLLOWUP_DAYS: Record<Tier, number> = {
  vip: 21,
  acquaintance: 42,
  broader: 90,
};

export function openDatabase(databasePath: string): DatabaseSync {
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");
  return database;
}

export function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export function followupDate(tier: string): string {
  const days = FOLLOWUP_DAYS[tier] ?? 30;
  const target = new Date();
  target.setDate(target.getDate() + days);
  return target.toISOString().split("T")[0];
}

export function formatMonthDay(inputDate: Date): string {
  const month = String(inputDate.getMonth() + 1).padStart(2, "0");
  const day = String(inputDate.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}
