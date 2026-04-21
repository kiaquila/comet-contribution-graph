import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as core from "@actions/core";
import * as actionsExec from "@actions/exec";
import { fetchContributions } from "./data.js";
import { renderCometSVG } from "./renderer.js";
import { DARK_THEME } from "./themes.js";

const USERNAME_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/;
const BRANCH_CHARSET_RE = /^[A-Za-z0-9._/-]{1,100}$/;

// Names git treats as pseudo-refs rather than ordinary branches. Using any
// of these with `git checkout --orphan` or `git push HEAD:<name>` fails
// fatally, and they never make sense as an output-branch for a profile
// Action. Reject them so the error surfaces before fetch/render work.
const RESERVED_GIT_REFS = new Set([
  "HEAD",
  "FETCH_HEAD",
  "ORIG_HEAD",
  "MERGE_HEAD",
  "CHERRY_PICK_HEAD",
  "REVERT_HEAD",
  "BISECT_HEAD",
]);

// Subset of git-check-ref-format --branch sufficient to reject inputs the
// broad BRANCH_CHARSET_RE lets through. Rules are applied per slash-
// delimited segment (git refs are path-like): `foo/.bar` and
// `foo/bar.lock/baz` are invalid even though the full string looks fine.
// Without this, an invalid branch reaches `git checkout --orphan` and
// fails late after fetch/render work is already done.
function isValidGitBranchName(name: string): boolean {
  if (!BRANCH_CHARSET_RE.test(name)) return false;
  if (name === "@") return false;
  if (RESERVED_GIT_REFS.has(name)) return false;
  if (name.startsWith("-")) return false; // ambiguous with a CLI flag
  if (name.startsWith("/") || name.endsWith("/")) return false;
  if (name.endsWith(".")) return false;
  if (name.includes("..") || name.includes("//") || name.includes("@{")) {
    return false;
  }
  for (const segment of name.split("/")) {
    if (segment.length === 0) return false;
    if (segment.startsWith(".")) return false;
    if (segment.endsWith(".lock")) return false;
  }
  return true;
}

// Mutable object so tests can replace individual properties without hitting
// the ESM frozen-namespace restriction on `export let` live-binding assignment.
// Kept as a single object to avoid proliferating named exports.
export const _fns = {
  exec: actionsExec.exec as typeof actionsExec.exec,
  setFailed: (msg: string | Error) => core.setFailed(msg),
  setSecret: (secret: string) => core.setSecret(secret),
  info: (msg: string) => core.info(msg),
};

export async function run(): Promise<void> {
  try {
    const username = core.getInput("username", { required: true });
    const token =
      core.getInput("token") || process.env["GITHUB_TOKEN"] || "";
    const reducedInput = core.getInput("reduced");
    const reduced = (reducedInput === "" ? "true" : reducedInput) !== "false";
    const branchInput = core.getInput("branch");
    const branch = branchInput === "" ? "comet-graph" : branchInput;

    if (!username) {
      _fns.setFailed("username input is required");
      return;
    }

    if (!USERNAME_RE.test(username)) {
      _fns.setFailed(
        `username contains invalid characters: ${username}. Must match /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/`,
      );
      return;
    }

    if (!isValidGitBranchName(branch)) {
      _fns.setFailed(
        `branch is not a valid git branch name: ${branch}. Must satisfy git-check-ref-format rules (no leading '-', '.', '/'; no trailing '.', '/', '.lock'; no '..' or '//'; charset [A-Za-z0-9._/-] length 1-100).`,
      );
      return;
    }

    if (!token) {
      _fns.setFailed("token input or GITHUB_TOKEN env var is required");
      return;
    }

    const repo = process.env["GITHUB_REPOSITORY"];
    if (!repo) {
      _fns.setFailed("GITHUB_REPOSITORY env var missing");
      return;
    }

    _fns.setSecret(token);

    const days = await fetchContributions(username, token);

    const animatedSvg = renderCometSVG(days, {
      theme: DARK_THEME,
      animated: true,
    });

    const workdir = await mkdtemp(join(tmpdir(), "comet-graph-"));
    await writeFile(join(workdir, "comet.svg"), animatedSvg, "utf8");
    const files = ["comet.svg"];

    if (reduced) {
      const reducedSvg = renderCometSVG(days, {
        theme: DARK_THEME,
        animated: false,
      });
      await writeFile(join(workdir, "comet-reduced.svg"), reducedSvg, "utf8");
      files.push("comet-reduced.svg");
    }

    await pushOrphan({ workdir, branch, token, repo, files });

    _fns.info(`Pushed ${files.join(", ")} to ${branch}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    _fns.setFailed(msg);
  }
}

async function pushOrphan(args: {
  readonly workdir: string;
  readonly branch: string;
  readonly token: string;
  readonly repo: string;
  readonly files: readonly string[];
}): Promise<void> {
  const opts = { cwd: args.workdir };

  if (process.env["COMET_DRY_RUN"] === "1") {
    _fns.info("[dry-run] would execute:");
    _fns.info(`  git init --quiet`);
    _fns.info(`  git config user.name comet-graph-bot`);
    _fns.info(
      `  git config user.email comet-graph-bot@users.noreply.github.com`,
    );
    _fns.info(`  git checkout --orphan ${args.branch}`);
    _fns.info(`  git add ${args.files.join(" ")}`);
    _fns.info(
      `  git commit --quiet -m "chore: regenerate ${args.files.join(", ")}"`,
    );
    _fns.info(
      `  git push --force --quiet https://x-access-token:<token>@github.com/${args.repo}.git HEAD:${args.branch}`,
    );
    return;
  }

  await _fns.exec("git", ["init", "--quiet"], opts);
  await _fns.exec("git", ["config", "user.name", "comet-graph-bot"], opts);
  await _fns.exec(
    "git",
    [
      "config",
      "user.email",
      "comet-graph-bot@users.noreply.github.com",
    ],
    opts,
  );
  await _fns.exec("git", ["checkout", "--orphan", args.branch], opts);
  await _fns.exec("git", ["add", ...args.files], opts);
  await _fns.exec(
    "git",
    [
      "commit",
      "--quiet",
      "-m",
      `chore: regenerate ${args.files.join(", ")}`,
    ],
    opts,
  );
  const url = `https://x-access-token:${args.token}@github.com/${args.repo}.git`;
  await _fns.exec(
    "git",
    ["push", "--force", "--quiet", url, `HEAD:${args.branch}`],
    opts,
  );
}

const entrypoint = process.argv[1];
if (entrypoint && fileURLToPath(import.meta.url) === entrypoint) {
  void run();
}
