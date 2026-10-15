#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  extractClaudeOutcome,
  isTrustedReviewLogin,
  isCodexReviewCommentSignal,
  latestAiReviewRequestMarker,
  reviewCommentTimestamp,
} from "./ai-review-helpers.mjs";
import { readConfig } from "./shared.mjs";

const rerunnableConclusions = new Set([
  "failure",
  "cancelled",
  "timed_out",
  "action_required",
  "startup_failure",
]);
const activeStatuses = new Set([
  "queued",
  "in_progress",
  "waiting",
  "requested",
  "pending",
]);

function normalizeAgent(agent) {
  return (
    String(agent || "codex")
      .trim()
      .toLowerCase() || "codex"
  );
}

export function shouldRouteAiReviewRerunEvent(
  event,
  selectedAgent = "codex",
  config = {},
) {
  const agent = normalizeAgent(selectedAgent);
  const enabledReviewAgents = new Set(
    config.reviewAgents || ["codex", "gemini"],
  );

  if (!enabledReviewAgents.has(agent)) {
    return false;
  }

  if (event?.workflow_run) {
    const run = event.workflow_run;
    return (
      event.action === "completed" &&
      run.name === "AI Review" &&
      run.path === ".github/workflows/ai-review.yml" &&
      run.event === "pull_request" &&
      run.status === "completed"
    );
  }

  if (event?.review) {
    return (
      ["codex", "gemini"].includes(agent) &&
      isTrustedReviewLogin(event.review.user?.login, agent, config)
    );
  }

  if (!event?.issue?.pull_request || !event?.comment) return false;
  if (event.action && !["created", "edited"].includes(event.action))
    return false;
  const body = String(event.comment.body || "");
  const login = event.comment.user?.login;

  if (agent === "codex") {
    return (
      isCodexReviewCommentSignal(body) &&
      isTrustedReviewLogin(login, "codex", config)
    );
  }

  if (agent === "claude") {
    return (
      Boolean(extractClaudeOutcome(body)) &&
      isTrustedReviewLogin(login, "claude", config)
    );
  }

  return false;
}

export function selectAiReviewRun(runs = [], headSha, { evidenceAt } = {}) {
  const matchingRuns = runs
    .filter((run) => run.event === "pull_request" && run.head_sha === headSha)
    .sort(
      (left, right) =>
        Date.parse(right.created_at || "") - Date.parse(left.created_at || ""),
    );
  const activeRun = matchingRuns.find((run) => activeStatuses.has(run.status));
  if (activeRun) return { action: "already_running", run: activeRun };
  const run = matchingRuns[0];
  if (!run) return { action: "not_found", run: null };
  // run_started_at changes on each attempt, unlike created_at. Completion
  // events only requeue evidence that could have raced the preceding attempt.
  if (
    evidenceAt &&
    !(
      Date.parse(evidenceAt) >= Date.parse(run.run_started_at || run.created_at)
    )
  )
    return { action: "already_evaluated", run };
  if (
    run.status === "completed" &&
    (rerunnableConclusions.has(run.conclusion) ||
      (evidenceAt && run.conclusion === "success"))
  )
    return { action: "rerun", run };
  if (run.status === "completed" && run.conclusion === "success")
    return { action: "already_success", run };
  return { action: "not_found", run: null };
}

async function defaultRequest(token, repository, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function listPaginated(request, token, repository, path) {
  const items = [];
  const separator = path.includes("?") ? "&" : "?";
  for (let page = 1; ; page += 1) {
    const data = await request(
      token,
      repository,
      `${path}${separator}per_page=100&page=${page}`,
    );
    const batch = data.workflow_runs || data;
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

export async function rerunAiReviewForPrHead({
  token,
  repository,
  headSha,
  prNumber,
  evidenceAt,
  request = defaultRequest,
}) {
  if (!token || !repository || !headSha) {
    throw new Error(
      "token, repository, and headSha are required to rerun AI Review.",
    );
  }

  const [owner, repo] = repository.split("/");
  const currentHeadMatches = async () => {
    if (!prNumber) return true;
    const pull = await request(
      token,
      repository,
      `/repos/${owner}/${repo}/pulls/${prNumber}`,
    );
    return pull.state === "open" && pull.head?.sha === headSha;
  };
  if (!(await currentHeadMatches()))
    return {
      action: "stale",
      run: null,
      message: "PR head changed or PR closed; no rerun requested.",
    };
  const runs = await listPaginated(
    request,
    token,
    repository,
    `/repos/${owner}/${repo}/actions/workflows/ai-review.yml/runs?event=pull_request&head_sha=${encodeURIComponent(headSha)}`,
  );
  const selected = selectAiReviewRun(runs, headSha, { evidenceAt });

  if (selected.action === "rerun") {
    if (!(await currentHeadMatches()))
      return {
        action: "stale",
        run: null,
        message: "PR head changed before rerun; no rerun requested.",
      };
    await request(
      token,
      repository,
      `/repos/${owner}/${repo}/actions/runs/${selected.run.id}/rerun`,
      { method: "POST" },
    );
    return {
      ...selected,
      message: `Requested AI Review rerun for ${headSha} from run ${selected.run.id}.`,
    };
  }

  const runId = selected.run?.id ? ` run ${selected.run.id}` : "";
  const messages = {
    already_evaluated: `AI Review already evaluated evidence through ${evidenceAt}${runId}.`,
    already_running: `AI Review is already running for ${headSha}${runId}.`,
    already_success: `AI Review already passed for ${headSha}${runId}.`,
    not_found: `No completed AI Review pull_request run found for ${headSha}.`,
  };

  return {
    ...selected,
    message: messages[selected.action],
  };
}

async function resolvePullContext({
  token,
  repository,
  event,
  request = defaultRequest,
}) {
  const prNumber =
    event.workflow_run?.pull_requests?.[0]?.number ||
    event.pull_request?.number ||
    (event.issue?.pull_request && event.issue.number);
  if (!prNumber) return null;
  // Event payloads can already be stale when a runner starts.
  const pull = await request(
    token,
    repository,
    `/repos/${repository}/pulls/${prNumber}`,
  );
  if (pull.state !== "open") return null;
  if (event.workflow_run && event.workflow_run.head_sha !== pull.head?.sha)
    return null;
  return { prNumber, headSha: pull.head?.sha };
}

export async function routeAiReviewRerun({
  token,
  repository,
  event,
  selectedAgent = "codex",
  config = {},
  request = defaultRequest,
}) {
  if (!shouldRouteAiReviewRerunEvent(event, selectedAgent, config))
    return {
      action: "ignored",
      message: "Event is not trusted review evidence for the selected agent.",
    };
  const context = await resolvePullContext({
    token,
    repository,
    event,
    request,
  });
  if (!context)
    return {
      action: "stale",
      message: "No open current-head PR for this event.",
    };
  let evidenceAt =
    event.review?.submitted_at || reviewCommentTimestamp(event.comment);
  if (event.workflow_run) {
    const [comments, reviews] = await Promise.all([
      listPaginated(
        request,
        token,
        repository,
        `/repos/${repository}/issues/${context.prNumber}/comments`,
      ),
      listPaginated(
        request,
        token,
        repository,
        `/repos/${repository}/pulls/${context.prNumber}/reviews`,
      ),
    ]);
    const marker = latestAiReviewRequestMarker(
      comments,
      selectedAgent,
      context.headSha,
      config,
    );
    const times = [
      marker?.commentCreatedAt,
      ...comments
        .filter((comment) =>
          shouldRouteAiReviewRerunEvent(
            { issue: { pull_request: {} }, comment },
            selectedAgent,
            config,
          ),
        )
        .map(reviewCommentTimestamp),
      ...reviews
        .filter(
          (review) =>
            review.commit_id === context.headSha &&
            isTrustedReviewLogin(review.user?.login, selectedAgent, config),
        )
        .map((review) => review.submitted_at),
    ].filter((value) => Number.isFinite(Date.parse(value)));
    evidenceAt = times.sort(
      (left, right) => Date.parse(right) - Date.parse(left),
    )[0];
    if (!evidenceAt)
      return {
        action: "ignored",
        message: "No new review evidence to requeue.",
      };
  }
  return rerunAiReviewForPrHead({
    token,
    repository,
    ...context,
    evidenceAt,
    request,
  });
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const selectedAgent = normalizeAgent(process.env.AI_REVIEW_AGENT);
  const config = readConfig();

  if (!token || !repository || !eventPath) {
    console.error(
      "GITHUB_TOKEN, GITHUB_REPOSITORY, and GITHUB_EVENT_PATH are required.",
    );
    process.exit(1);
  }

  const event = JSON.parse(readFileSync(eventPath, "utf8"));
  const result = await routeAiReviewRerun({
    token,
    repository,
    event,
    selectedAgent,
    config,
  });
  console.log(result.message);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(`AI Review rerun failed: ${error.message}`);
    process.exit(1);
  }
}
