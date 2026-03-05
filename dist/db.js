"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openDatabase = openDatabase;
exports.todayIso = todayIso;
exports.followupDate = followupDate;
exports.formatMonthDay = formatMonthDay;
const node_sqlite_1 = require("node:sqlite");
const FOLLOWUP_DAYS = {
    vip: 21,
    acquaintance: 42,
    broader: 90,
};
function openDatabase(databasePath) {
    const database = new node_sqlite_1.DatabaseSync(databasePath);
    database.exec("PRAGMA journal_mode = WAL");
    database.exec("PRAGMA foreign_keys = ON");
    return database;
}
function todayIso() {
    return new Date().toISOString().split("T")[0];
}
function followupDate(tier) {
    const days = FOLLOWUP_DAYS[tier] ?? 30;
    const target = new Date();
    target.setDate(target.getDate() + days);
    return target.toISOString().split("T")[0];
}
function formatMonthDay(inputDate) {
    const month = String(inputDate.getMonth() + 1).padStart(2, "0");
    const day = String(inputDate.getDate()).padStart(2, "0");
    return `${month}-${day}`;
}
