import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const workflow = readFileSync(
  new URL("../.github/workflows/ai-review.yml", import.meta.url),
  "utf8",
);
const guard = workflow.match(
  /node --input-type=module <<'NODE'\n([\s\S]*?)\n\s+NODE/,
)[1];
const repository = "kiaquila/comet-contribution-graph";
const head = "a".repeat(40);
const pull = {
  state: "open",
  draft: false,
  head: { sha: head, repo: { full_name: repository } },
  base: { ref: "main", repo: { full_name: repository } },
};

function runGuard({ env = {}, response = pull, ok = true } = {}) {
  return spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `globalThis.fetch = async (url, options) => {
        if (url !== "https://api.github.com/repos/${repository}/pulls/55" ||
            options.headers.authorization !== "Bearer test-token") throw new Error("Unexpected request");
        return { ok: ${JSON.stringify(ok)}, status: ${ok ? 200 : 403}, json: async () => (${JSON.stringify(response)}) };
      };\n${guard}`,
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_TOKEN: "test-token",
        GITHUB_REPOSITORY: repository,
        ROLLOUT_PR_NUMBER: "55",
        ROLLOUT_WORKFLOW_SHA: head,
        ROLLOUT_WORKFLOW_REF: "refs/heads/codex/native-review-receipts",
        SELECTED_AGENT: "codex",
        ...env,
      },
    },
  );
}

test("the actual rollout guard accepts only the open, same-repository final head", () => {
  const result = runGuard();
  assert.equal(result.status, 0, result.stderr);
});

test("the actual rollout guard rejects another target, policy, or dispatch ref", () => {
  for (const env of [
    { GITHUB_REPOSITORY: "attacker/fork" },
    { ROLLOUT_PR_NUMBER: "56" },
    { ROLLOUT_WORKFLOW_REF: "refs/heads/main" },
    { ROLLOUT_WORKFLOW_SHA: "b".repeat(40) },
    { SELECTED_AGENT: "gemini" },
  ]) {
    const result = runGuard({ env });
    assert.notEqual(result.status, 0, JSON.stringify(env));
  }
});

test("the actual rollout guard fails closed on unavailable, closed, draft, or forked PRs", () => {
  for (const options of [
    { ok: false },
    { response: { ...pull, state: "closed" } },
    { response: { ...pull, draft: true } },
    {
      response: {
        ...pull,
        head: { ...pull.head, repo: { full_name: "attacker/fork" } },
      },
    },
    {
      response: {
        ...pull,
        base: { ...pull.base, repo: { full_name: "attacker/fork" } },
      },
    },
    { response: { ...pull, base: { ...pull.base, ref: "other" } } },
  ]) {
    assert.notEqual(runGuard(options).status, 0, JSON.stringify(options));
  }
});

test("rollout cannot select arbitrary code or gain write credentials", () => {
  assert.match(
    workflow,
    /ref: \$\{\{ github.event_name == 'workflow_dispatch' && inputs.receipt_rollout && '5773da6b5b93d5f91486b2c6d631e56faea4da44' \|\| github.event.repository.default_branch \}\}/,
  );
  assert.match(workflow, /persist-credentials: false/);
  assert.match(
    workflow,
    /permissions:\n  contents: read\n  pull-requests: read\n  issues: read\n/,
  );
  assert.doesNotMatch(
    workflow,
    /: write\b|secrets\.|upload-artifact|download-artifact/,
  );
  assert.doesNotMatch(workflow, /skip\|comment\)/);
  assert.match(
    workflow,
    /AI_REVIEW_HEAD_SHA: \$\{\{ steps.pr.outputs.head_sha \}\}/,
  );
  assert.match(workflow, /run: node scripts\/ai-review-gate\.mjs/);
});
