import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createAiReviewRequestMarkerBody } from "../scripts/ai-review-helpers.mjs";

const sha = "2667f79cd7676ff331730cabf661d38dbbcddb0d";
const bot = { login: "chatgpt-codex-connector[bot]" };
const at = "2026-10-15T21:01:00Z";
const before = "2026-10-15T21:00:00Z";
const body =
  "<!-- codex-review-receipt:v1 -->\n\nCodex Review: Didn't find any major issues. :rocket:\n\n**Reviewed commit:** `2667f79cd7`";
const marker = {
  id: 1,
  user: { login: "github-actions[bot]" },
  created_at: before,
  body: createAiReviewRequestMarkerBody({
    agent: "codex",
    headSha: sha,
    requestId: "test",
    sourceCommentId: "3",
    sourceCommentCreatedAt: before,
    requestedAt: before,
  }),
};
const comment = { id: 2, user: bot, created_at: at, updated_at: at, body };
const review = {
  id: 5,
  user: bot,
  commit_id: sha,
  state: "COMMENTED",
  submitted_at: at,
};

// Execute the real workflow entrypoint. Only HTTP is replaced, so assertions
// cover evidence fetching, classification, final head check, and exit status.
function gate(overrides = {}) {
  const snapshot = {
    sha,
    comments: [marker, comment],
    reviews: [],
    inline: [],
    threads: [],
    ...overrides,
  };
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    const data = JSON.parse(process.env.REVIEW_GATE_FIXTURE);
    let reads = 0;
    globalThis.fetch = async (url, options = {}) => {
      const path = new URL(url).pathname;
      let value;
      if (path.endsWith('/pulls/8')) value = {head: {sha: ++reads > 1 && data.race ? 'f'.repeat(40) : data.sha}};
      else if (path.endsWith('/issues/8/comments')) value = options.method === 'POST' ? {} : data.comments;
      else if (path.endsWith('/pulls/8/reviews')) value = data.reviews;
      else if (path.endsWith('/pulls/8/comments')) value = data.inline;
      else if (path.endsWith('/issues/8/timeline')) value = data.timeline || [];
      else if (path === '/graphql') value = {data: {repository: {pullRequest: {reviewThreads: {nodes: data.threads, pageInfo: {hasNextPage: false}}}}}};
      else throw new Error('Unexpected HTTP request ' + path);
      return {ok: true, status: 200, json: async () => value};
    };
    await import('./scripts/ai-review-gate.mjs');
  `,
    ],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_TOKEN: "test-only",
        GITHUB_REPOSITORY: "owner/repo",
        AI_REVIEW_AGENT: "codex",
        AI_REVIEW_HEAD_SHA: sha,
        AI_REVIEW_PR_NUMBER: "8",
        AI_REVIEW_TRIGGER_MODE: "skip",
        AI_REVIEW_WAIT_MS: "1",
        AI_REVIEW_DEBOUNCE_MS: "0",
        REVIEW_GATE_FIXTURE: JSON.stringify(snapshot),
      },
    },
  );
  return { status: result.status, output: result.stdout + result.stderr };
}

test("actual AI Review entrypoint accepts receipt, legacy, and current-head formal review", () => {
  for (const snapshot of [
    {},
    {
      comments: [
        marker,
        {
          ...comment,
          body: body.replace("<!-- codex-review-receipt:v1 -->\n\n", ""),
        },
      ],
    },
    { comments: [], reviews: [review] },
  ]) {
    const result = gate(snapshot);
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /gate passed/);
  }
});

test("actual gate fails closed for missing/negative evidence and unresolved findings", () => {
  for (const snapshot of [
    {
      comments: [
        marker,
        {
          ...comment,
          body: "<!-- codex-pull-request-review-summary -->\nCompleted 👍",
        },
      ],
    },
    { comments: [marker, { ...comment, user: { login: "spoof" } }] },
    {
      comments: [
        marker,
        { ...comment, body: body.replace("2667f79cd7", "ffffffffff") },
      ],
    },
    {
      comments: [
        marker,
        { ...comment, body: "<!-- codex-review-receipt:v1 -->\n" + body },
      ],
    },
    {
      comments: [marker],
      reviews: [{ ...review, body: "P1 issue", submitted_at: before }],
    },
    {
      threads: [
        {
          isResolved: false,
          comments: { nodes: [{ body: "P1 old-head finding", author: bot }] },
        },
      ],
    },
    {
      threads: [
        {
          isResolved: false,
          comments: { nodes: [{ body: "untagged finding", author: bot }] },
        },
      ],
    },
    { comments: [], reviews: [{ ...review, commit_id: undefined }] },
  ]) {
    const result = gate(snapshot);
    assert.equal(result.status, 1, result.output);
    assert.doesNotMatch(result.output, /gate passed/);
  }
});

test("push racing the final API reads cannot publish a passing AI Review", () => {
  const result = gate({ race: true });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /rejected stale run/);
  assert.doesNotMatch(result.output, /gate passed/);
});
