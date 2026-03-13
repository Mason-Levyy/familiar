import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, relative, isAbsolute, dirname } from "node:path";

const PROTECTED_BRANCHES = new Set(["main", "master"]);

interface FileChange {
  path: string;
  content: string;
}

interface Params {
  branch: string;
  changes: FileChange[];
  commit_message: string;
  pr_title: string;
  pr_body: string;
}

function git(repoRoot: string, args: string[]): string {
  return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" });
}

export function proposeSelfImprovement(
  repoRoot: string,
  params: Params
): { ok: boolean; pr_url?: string; error?: string } {
  const { branch, changes, commit_message, pr_title, pr_body } = params;

  if (PROTECTED_BRANCHES.has(branch)) {
    return { ok: false, error: `Branch "${branch}" is protected — choose a feature branch name.` };
  }

  if (!branch || !/^[a-zA-Z0-9._\-/]+$/.test(branch)) {
    return { ok: false, error: "Invalid branch name." };
  }

  for (const change of changes) {
    const abs = resolve(repoRoot, change.path);
    const rel = relative(repoRoot, abs);
    if (rel.startsWith("..") || isAbsolute(rel)) {
      return { ok: false, error: `Path "${change.path}" escapes the repository root.` };
    }
  }

  let originalBranch = "main";
  try {
    originalBranch = git(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  } catch {
    // ignore, best effort
  }

  try {
    git(repoRoot, ["checkout", "-b", branch]);

    for (const change of changes) {
      const abs = resolve(repoRoot, change.path);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, change.content, "utf8");
    }

    const filePaths = changes.map((c) => resolve(repoRoot, c.path));
    git(repoRoot, ["add", "--", ...filePaths]);
    git(repoRoot, ["commit", "-m", commit_message]);
    git(repoRoot, ["push", "origin", branch]);

    const prOutput = execFileSync(
      "gh",
      ["pr", "create", "--title", pr_title, "--body", pr_body, "--head", branch, "--base", "main"],
      { cwd: repoRoot, encoding: "utf8" }
    );

    const pr_url = prOutput.trim().split("\n").pop() ?? prOutput.trim();

    git(repoRoot, ["checkout", originalBranch]);

    return { ok: true, pr_url };
  } catch (err: unknown) {
    // Best-effort: return to original branch
    try { git(repoRoot, ["checkout", originalBranch]); } catch { /* ignore */ }

    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
