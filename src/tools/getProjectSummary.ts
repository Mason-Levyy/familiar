import { openDatabase } from "../db";

interface GetProjectSummaryParams {
  project_id: number;
  log_limit?: number;
}

export function getProjectSummary(databasePath: string, params: GetProjectSummaryParams) {
  const logLimit = params.log_limit ?? 10;
  const database = openDatabase(databasePath);
  try {
    const project = database.prepare(
      "SELECT * FROM projects WHERE id = ?"
    ).get(params.project_id) as Record<string, unknown> | undefined;

    if (!project) {
      return { success: false, error: `Project ${params.project_id} not found` };
    }

    const openTasks = database.prepare(
      "SELECT * FROM tasks WHERE project_id = ? AND status IN ('todo', 'in_progress', 'blocked') ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END"
    ).all(params.project_id);

    const completedCount = database.prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status = 'done'"
    ).get(params.project_id) as { count: number };

    const overdueTasks = database.prepare(
      "SELECT * FROM tasks WHERE project_id = ? AND status IN ('todo', 'in_progress') AND due_date IS NOT NULL AND due_date < date('now') ORDER BY due_date"
    ).all(params.project_id);

    const recentLogs = database.prepare(
      "SELECT * FROM project_logs WHERE project_id = ? ORDER BY date DESC, created_at DESC LIMIT ?"
    ).all(params.project_id, logLimit);

    return {
      success: true,
      project,
      open_tasks: openTasks,
      open_count: openTasks.length,
      completed_count: completedCount.count,
      overdue_tasks: overdueTasks,
      overdue_count: overdueTasks.length,
      recent_logs: recentLogs,
    };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  } finally {
    database.close();
  }
}
