import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  evaluateCodexReviewEvidence,
  isAcceptableCodexSummaryComment,
  classifyCodexNativeReview,
} from "../scripts/ai-review-helpers.mjs";
import {
  routeAiReviewRerun,
  shouldRouteAiReviewRerunEvent,
  selectAiReviewRun,
} from "../scripts/ai-review-rerun.mjs";

const headSha = "2667f79cd7676ff331730cabf661d38dbbcddb0d";
const otherSha = "f".repeat(40);
const bot = { login: "chatgpt-codex-connector[bot]", type: "Bot" };
const before = "2026-10-15T21:00:00Z";
const after = "2026-10-15T21:01:00Z";
const later = "2026-10-15T21:02:00Z";
const prefix = "<!-- codex-review-receipt:v1 -->";
const legacy =
  "Codex Review: Didn't find any major issues. :rocket:\n\n**Reviewed commit:** `2667f79cd7`";
const receipt = `${prefix}\n\n${legacy}`;
const comment = (body = receipt, overrides = {}) => ({
  id: 1,
  body,
  user: bot,
  created_at: after,
  updated_at: after,
  ...overrides,
});
const requestMarker = {
  agent: "codex",
  sha: headSha,
  sourceCommentCreatedAt: before,
};
const evidence = (overrides = {}) => ({
  headSha,
  requestMarker,
  comments: [comment()],
  ...overrides,
});
const review = (overrides = {}) => ({
  id: 5,
  user: bot,
  state: "COMMENTED",
  commit_id: headSha,
  submitted_at: after,
  ...overrides,
});
const summary =
  '<!-- codex-pull-request-review-summary -->\n<!-- codex-review-state:v1 {"code_review":{"commit_sha":"' +
  headSha +
  '","has_any_findings":false,"has_unresolved_findings":false,"status":"completed"}} -->\n\n## Codex Review Summary';

test("AI Review always executes default-branch scripts with read-only credentials", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/ai-review.yml", import.meta.url),
    "utf8",
  );
  const refs = [...workflow.matchAll(/^\s+ref: (.+)$/gm)].map(
    (match) => match[1],
  );
  assert.deepEqual(refs, ["${{ github.event.repository.default_branch }}"]);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(
    workflow,
    /permissions:\n  contents: read\n  pull-requests: read\n  issues: read\n/,
  );
  assert.doesNotMatch(
    workflow,
    /: write\b|secrets\.|upload-artifact|download-artifact/,
  );
  assert.match(workflow, /run: node scripts\/ai-review-gate\.mjs/);
  assert.match(
    workflow,
    /AI_REVIEW_HEAD_SHA: \$\{\{ steps.pr.outputs.head_sha \}\}/,
  );
});

test("observed native receipt and legacy response pass with commit proof", () => {
  for (const body of [
    receipt,
    legacy,
    receipt.replace("2667f79cd7`", `${headSha}\``),
    `${receipt}\n\n<details><summary>About Codex in GitHub</summary>Documentation</details>`,
  ]) {
    assert.equal(
      isAcceptableCodexSummaryComment(comment(body), headSha),
      true,
      body,
    );
    assert.equal(
      evaluateCodexReviewEvidence(evidence({ comments: [comment(body)] })),
      "pass",
    );
  }
});

test("receipt rejects stale, missing, ambiguous, and conflicting proof", () => {
  const bodies = [
    receipt.replace("2667f79cd7", "fffffffff0"),
    receipt.replace("2667f79cd7", "2667f79"),
    receipt.replace(/\n\n\*\*Reviewed commit:[^]*/, ""),
    receipt.replace("2667f79cd7", "2667f79cd70"),
    receipt.replace("v1", "v2"),
    receipt.replace(" -->", "-->"),
    `${prefix}\n${receipt}`,
    `<!-- unexpected -->\n${receipt}`,
    `${receipt}\n\n**Reviewed commit:** \`${otherSha}\``,
    `${receipt}\n\n**Reviewed commit:** \`2667f79cd7\``,
    receipt.replace("Didn't find", "Found"),
    receipt.replace(
      "Didn't find any major issues.",
      "Didn't find any major issues, but found P1.",
    ),
    `${receipt}\n\nP2: outstanding issue`,
    `${receipt}\n\n<details>P1: hidden finding</details>`,
    receipt.replace(":rocket:", "There are unresolved findings."),
    `${receipt}\n\nReview is pending`,
    receipt.replace(":rocket:", "However, changes requested."),
    `${receipt}\n\n<details>About</details>Conflicting result`,
    summary,
    "👍",
    "Completed",
  ];
  for (const body of bodies)
    assert.equal(
      isAcceptableCodexSummaryComment(comment(body), headSha, requestMarker),
      false,
      body,
    );
  assert.equal(
    isAcceptableCodexSummaryComment(
      comment(receipt, { user: { login: "spoof[bot]" } }),
      headSha,
    ),
    false,
  );
  assert.equal(
    isAcceptableCodexSummaryComment(comment(receipt), headSha.slice(0, 10)),
    false,
  );
  assert.equal(
    classifyCodexNativeReview(review({ commit_id: undefined }), [], headSha),
    null,
  );
});

test("legacy SHA-less proof keeps the request and intervening-push boundary", () => {
  const noSha = comment("Codex Review: Didn't find any major issues.");
  assert.equal(
    evaluateCodexReviewEvidence(evidence({ comments: [noSha] })),
    "pass",
  );
  assert.equal(
    evaluateCodexReviewEvidence(
      evidence({ comments: [noSha], requestMarker: null }),
    ),
    "missing_marker",
  );
  assert.equal(
    evaluateCodexReviewEvidence(
      evidence({
        comments: [noSha],
        timeline: [{ event: "committed", created_at: after }],
      }),
    ),
    "pending",
  );
  assert.equal(
    evaluateCodexReviewEvidence(
      evidence({
        comments: [comment(legacy.replace("2667f79cd7", "fffffffff0"))],
      }),
    ),
    "pending",
  );
});

test("new requests cannot hide findings and latest evidence determines acceptance", () => {
  const blocking = review({
    body: "P1: blocking finding",
    submitted_at: before,
  });
  assert.equal(
    evaluateCodexReviewEvidence(
      evidence({ comments: [], reviews: [blocking] }),
    ),
    "fail",
  );
  const thread = {
    isResolved: false,
    comments: { nodes: [{ body: "P1: old finding", author: bot }] },
  };
  assert.equal(
    evaluateCodexReviewEvidence(
      evidence({ reviews: [blocking], threads: [thread] }),
    ),
    "fail",
  );
  assert.equal(
    evaluateCodexReviewEvidence(
      evidence({
        reviews: [blocking],
        threads: [{ ...thread, isResolved: true }],
      }),
    ),
    "pass",
  );
  assert.equal(
    evaluateCodexReviewEvidence(
      evidence({
        comments: [
          comment(),
          comment(
            receipt.replace(
              "Didn't find any major issues.",
              "P1: blocking issue.",
            ),
            { updated_at: later },
          ),
        ],
      }),
    ),
    "fail",
  );
  assert.equal(
    evaluateCodexReviewEvidence(
      evidence({
        comments: [
          comment(),
          comment(
            receipt.replace("Didn't find any major issues.", "Review pending."),
            { updated_at: later },
          ),
        ],
      }),
    ),
    "pending",
  );
  assert.equal(
    evaluateCodexReviewEvidence(
      evidence({ reviews: [review({ body: "P1", submitted_at: later })] }),
    ),
    "fail",
  );
  assert.equal(
    evaluateCodexReviewEvidence(
      evidence({ reviews: [review({ body: "P1" })] }),
    ),
    "fail",
    "failure wins timestamp tie",
  );
  assert.equal(
    evaluateCodexReviewEvidence(
      evidence({ comments: [], reviews: [review()], requestMarker: null }),
    ),
    "pass",
  );
  assert.equal(
    classifyCodexNativeReview(
      review(),
      [
        {
          pull_request_review_id: 5,
          user: bot,
          body: "P3 advisory, also P1 blocker",
        },
      ],
      headSha,
    ),
    "fail",
  );
});

test("structured summaries only wake evaluation, including edited old comments", () => {
  for (const body of [
    summary,
    summary.replace('"status":"completed"', '"status":"in_progress"'),
    summary.replace('"has_any_findings":false', '"has_any_findings":true'),
    summary.replace(headSha, otherSha),
    summary.replace("false", '"false"'),
    `${summary}\n${summary}`,
    "<!-- codex-pull-request-review-summary -->\nmalformed",
  ]) {
    const updated = comment(body, { created_at: before, updated_at: later });
    assert.equal(
      evaluateCodexReviewEvidence(evidence({ comments: [updated] })),
      "pending",
    );
    for (const action of ["created", "edited"]) {
      assert.equal(
        shouldRouteAiReviewRerunEvent({
          action,
          issue: { pull_request: {} },
          comment: updated,
        }),
        true,
      );
      assert.equal(
        shouldRouteAiReviewRerunEvent({
          action,
          issue: { pull_request: {} },
          comment: { ...updated, user: { login: "fake" } },
        }),
        false,
      );
    }
  }
});

test("workflow filter and runtime router both wake for created/edited native signals", () => {
  const yaml = readFileSync(
    new URL("../.github/workflows/ai-review-rerun.yml", import.meta.url),
    "utf8",
  );
  assert.match(yaml, /issue_comment:\n\s+types: \[created, edited\]/);
  assert.match(
    yaml,
    /workflow_run:\n\s+workflows: \[AI Review\]\n\s+types: \[completed\]/,
  );
  assert.match(yaml, /ref: \$\{\{ github.event.repository.default_branch \}\}/);
  const expression = yaml.match(/    if: \|\n([^]*?)    runs-on:/)[1];
  const filter = new Function(
    "github",
    "startsWith",
    "contains",
    `return (${expression});`,
  );
  for (const action of ["created", "edited"])
    for (const body of [legacy, receipt, summary]) {
      const event = {
        action,
        issue: { pull_request: {} },
        comment: comment(body),
      };
      assert.equal(
        filter(
          { event_name: "issue_comment", event },
          (value, start) => value.startsWith(start),
          (value, part) => value.includes(part),
        ),
        true,
      );
      assert.equal(shouldRouteAiReviewRerunEvent(event), true);
    }
});

const run = (overrides = {}) => ({
  id: 42,
  event: "pull_request",
  head_sha: headSha,
  status: "completed",
  conclusion: "failure",
  created_at: before,
  run_started_at: before,
  ...overrides,
});
const completion = (overrides = {}) => ({
  action: "completed",
  workflow_run: {
    ...run(),
    name: "AI Review",
    path: ".github/workflows/ai-review.yml",
    pull_requests: [{ number: 8 }],
    ...overrides,
  },
});
function api({
  runs = [run()],
  comments = [comment()],
  headAfterList = headSha,
} = {}) {
  const calls = [];
  let listed = false;
  return {
    calls,
    request: async (_token, _repo, path, options = {}) => {
      calls.push({ path, method: options.method || "GET" });
      if (path.endsWith("/pulls/8"))
        return {
          number: 8,
          state: "open",
          head: { sha: listed ? headAfterList : headSha },
        };
      if (path.includes("/actions/workflows/")) {
        listed = true;
        return { workflow_runs: runs };
      }
      if (path.includes("/issues/8/comments")) return comments;
      if (path.includes("/pulls/8/reviews")) return [];
      if (path.endsWith("/rerun")) return null;
      throw new Error(`Unexpected API request ${path}`);
    },
  };
}
const route = (event, mock) =>
  routeAiReviewRerun({
    token: "test",
    repository: "owner/repo",
    event,
    request: mock.request,
  });

test("active gate completion requeues raced evidence exactly once", async () => {
  const signal = {
    action: "edited",
    issue: { number: 8, pull_request: {} },
    comment: comment(summary, { created_at: before, updated_at: after }),
  };
  const active = api({
    runs: [run({ status: "in_progress", conclusion: null })],
  });
  assert.equal((await route(signal, active)).action, "already_running");
  const completed = api();
  assert.equal((await route(completion(), completed)).action, "rerun");
  assert.equal(
    completed.calls.filter((call) => call.method === "POST").length,
    1,
  );
  const nextAttempt = api({ runs: [run({ run_started_at: later })] });
  assert.equal(
    (await route(completion(), nextAttempt)).action,
    "already_evaluated",
  );
  assert.equal(
    nextAttempt.calls.filter((call) => call.method === "POST").length,
    0,
  );
  const duplicate = api({
    runs: [run({ status: "queued", conclusion: null })],
  });
  assert.equal((await route(signal, duplicate)).action, "already_running");
});

test("new evidence rechecks success and never selects an older failure", () => {
  const success = run({
    id: 43,
    conclusion: "success",
    created_at: after,
    run_started_at: after,
  });
  assert.equal(
    selectAiReviewRun([run(), success], headSha).action,
    "already_success",
  );
  assert.equal(
    selectAiReviewRun([run(), success], headSha, { evidenceAt: later }).action,
    "rerun",
  );
  assert.equal(
    selectAiReviewRun([success], headSha, { evidenceAt: before }).action,
    "already_evaluated",
  );
});

test("requeue rechecks live HEAD and rejects stale completion/push races", async () => {
  const stale = api();
  assert.equal(
    (await route(completion({ head_sha: otherSha }), stale)).action,
    "stale",
  );
  assert.equal(stale.calls.filter((call) => call.method === "POST").length, 0);
  const raced = api({ headAfterList: otherSha });
  assert.equal((await route(completion(), raced)).action, "stale");
  assert.equal(raced.calls.filter((call) => call.method === "POST").length, 0);
  for (const changes of [
    { name: "CI" },
    { event: "workflow_dispatch" },
    { path: ".github/workflows/untrusted.yml" },
  ]) {
    assert.equal((await route(completion(changes), api())).action, "ignored");
  }
});

test("real connector receipt fixture reproduces the original prefix regression", () => {
  const fixture = JSON.parse(
    readFileSync(
      new URL("./fixtures/codex-no-findings-receipt.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(fixture.comment.user.login, bot.login);
  assert.equal(
    isAcceptableCodexSummaryComment(fixture.comment, fixture.headSha),
    true,
  );
  assert.equal(
    isAcceptableCodexSummaryComment(
      {
        ...fixture.comment,
        body: fixture.comment.body.replace(`${prefix}\n\n`, ""),
      },
      fixture.headSha,
    ),
    true,
  );
  assert.equal(
    isAcceptableCodexSummaryComment(fixture.comment, otherSha),
    false,
  );
});

test("conflicting findings cannot hide in a trailing details block or verdict tail", () => {
  for (const body of [
    `${receipt}\n\n<details>P1: hidden finding</details>`,
    `${receipt}\n\n<details><summary>About Codex in GitHub</summary>P1: issue</details>`,
    receipt.replace(":rocket:", "There are unresolved findings."),
    receipt.replace(":rocket:", "There are findings."),
  ])
    assert.equal(
      isAcceptableCodexSummaryComment(comment(body), headSha, requestMarker),
      false,
      body,
    );
});
