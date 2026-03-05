import { DatabaseSync } from "node:sqlite";
export declare function openDatabase(databasePath: string): DatabaseSync;
export declare function todayIso(): string;
export declare function followupDate(tier: string): string;
export declare function formatMonthDay(inputDate: Date): string;
