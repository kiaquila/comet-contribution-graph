#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const options = {
  to: "",
  pr: "",
  rerun: true,
  comment: true,
  repo: "",
};

const usage = [
  "Usage:",
  "  node scripts/switch-review-agent.mjs --to <codex|gemini|claude> [--pr <number>] [--no-rerun] [--no-comment] [--repo <owner/name>]",
].join("\n");

for (let index = 0; index < args.length; index += 1) {
  const current = args[index];

  switch (current) {
    case "--to":
      options.to = (args[index + 1] || "").trim().toLowerCase();
      index += 1;
      break;
    case "--pr":
      options.pr = (args[index + 1] || "").trim();
      index += 1;
      break;
    case "--no-rerun":
      options.rerun = false;
      break;
    case "--no-comment":
      options.comment = false;
      break;
    case "--repo":
      options.repo = (args[index + 1] || "").trim();
      index += 1;
      break;
    default:
      throw new Error(`Unknown argument: ${current}\n\n${usage}`);
  }
}

const validAgents = new Set(["codex", "gemini", "claude"]);
if (!validAgents.has(options.to)) {
  throw new Error(`--to must be one of: codex, gemini, claude\n\n${usage}`);
}

// All three review backends are triggered by a human-authored comment on
// the PR. See docs_comet/project/devops/review-trigger-automation.md
// for why bot-posted comments are rejected.
const triggerBodies = {
  codex: "@codex review",
  gemini: "/gemini review",
  claude: "@claude review once",
};

const run = (command, commandArgs) =>
  execFileSync(command, commandArgs, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  }).trim();

const repoArgs = options.repo ? ["--repo", options.repo] : [];

// Step 0: resolve PR number from the current branch if not supplied.
if (!options.pr) {
  let json;
  try {
    json = run("gh", ["pr", "view", "--json", "number", ...repoArgs]);
  } catch (error) {
    throw new Error(
      "No open PR detected for the current branch. Pass --pr <number> explicitly.",
    );
  }
  options.pr = String(JSON.parse(json).number);
}

// Step 1: flip the AI_REVIEW_AGENT repository variable.
run("gh", [
  "variable",
  "set",
  "AI_REVIEW_AGENT",
  "--body",
  options.to,
  ...repoArgs,
]);
console.log(`Repository variable AI_REVIEW_AGENT set to ${options.to}.`);

// Step 2: post the native trigger comment on the target PR.
const triggerBody = triggerBodies[options.to];
if (!options.comment) {
  console.log("Skipped native trigger comment: --no-comment was used.");
} else {
  run("gh", ["pr", "comment", options.pr, "--body", triggerBody, ...repoArgs]);
  console.log(`Posted "${triggerBody}" on PR #${options.pr}.`);
}

// Step 3: rerun the most recent failed AI Review run at the current head SHA.
if (options.rerun) {
  const prJson = run("gh", [
    "pr",
    "view",
    options.pr,
    "--json",
    "headRefOid",
    ...repoArgs,
  ]);
  const headSha = JSON.parse(prJson).headRefOid;

  // Server-side filter by commit SHA so the rerun helper stays correct
  // in busy repos (previously capped client-side at 10 newest runs,
  // which in high-activity repos could miss the latest failed AI Review
  // for the current head and silently skip rerun).
  const runsJson = run("gh", [
    "run",
    "list",
    "--workflow",
    "ai-review.yml",
    "--commit",
    headSha,
    "--limit",
    "50",
    "--json",
    "databaseId,conclusion,headSha",
    ...repoArgs,
  ]);
  const runs = JSON.parse(runsJson);
  // Match any non-success terminal conclusion so the helper also
  // rescues Gemini-silent-timeout runs and cancelled reruns, not just
  // explicit failures.
  const rerunableConclusions = new Set([
    "failure",
    "timed_out",
    "cancelled",
    "startup_failure",
    "action_required",
  ]);
  const target = runs.find(
    (entry) =>
      entry.headSha === headSha && rerunableConclusions.has(entry.conclusion),
  );

  if (target) {
    // `gh run rerun --failed` only reruns jobs whose conclusion is
    // literally `failure`. For runs that ended in `cancelled`,
    // `timed_out`, `startup_failure`, or `action_required` there
    // may be no `failure`-conclusion jobs at all, so `--failed`
    // would fail the command. Rerun the whole run in those cases
    // and keep the targeted `--failed` behavior only for actual
    // job failures.
    const rerunArgs = ["run", "rerun", String(target.databaseId), ...repoArgs];
    if (target.conclusion === "failure") {
      rerunArgs.push("--failed");
    }
    run("gh", rerunArgs);
    console.log(
      `Re-run dispatched for AI Review run ${target.databaseId} (conclusion: ${target.conclusion}).`,
    );
  } else {
    console.log(
      "No rerunable AI Review run found for the current head SHA; skipping rerun.",
    );
  }
} else {
  console.log("Skipped AI Review rerun because --no-rerun was used.");
}
