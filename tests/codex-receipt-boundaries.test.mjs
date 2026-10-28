import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { isStrictNativeCodexReceipt } from "../scripts/codex-native-receipt.mjs";
import { isAcceptableCodexSummaryComment } from "../scripts/ai-review-helpers.mjs";
const head = "1234567890abcdef1234567890abcdef12345678";
const closings = [
  "",
  ":+1:",
  ":rocket:",
  ":tada:",
  "Already looking forward to the next diff.",
  "Another round soon, please!",
  "Bravo.",
  "Breezy!",
  "Can't wait for the next one!",
  "Chef's kiss.",
  "Delightful!",
  "Hooray!",
  "Keep it up!",
  "Keep them coming!",
  "More of your lovely PRs please.",
  "Nice work!",
  "Swish!",
  "What shall we delve into next?",
  "You're on a roll.",
  "🚀",
  "🎉",
];
const requested = "2026-10-20T12:00:00Z";
const marker = {
  agent: "codex",
  sha: head,
  sourceCommentId: 1,
  sourceCommentCreatedAt: requested,
  requestedAt: requested,
};
const record = (body) => ({
  id: 2,
  user: { login: "chatgpt-codex-connector[bot]" },
  body,
  created_at: "2026-10-20T12:02:00Z",
  updated_at: "2026-10-20T12:02:00Z",
});
const acceptable = (comment) =>
  isAcceptableCodexSummaryComment(comment, head, marker);
for (const closing of closings)
  test(`observed closing: ${closing || "empty"}`, () => {
    const body = `<!-- codex-review-receipt:v1 -->\n\nCodex Review: Didn't find any major issues.${closing ? " " + closing : ""}\n\n**Reviewed commit:** \`${head.slice(0, 10)}\``;
    assert.equal(acceptable(record(body)), true);
    for (const bad of [
      body.replace(
        "Didn't find any major issues.",
        "Didn't find any major issues. Authentication leaks credentials.",
      ),
      body + "\nUnresolved vulnerability.",
      body + "\n**Reviewed commit:** `" + head + "`",
      body.replace(":v1", ":v2"),
      body.replace(head.slice(0, 10), "f".repeat(10)),
      body +
        "\n<details><summary>About Codex in GitHub</summary>Unresolved vulnerability.</details>",
    ]) {
      assert.equal(isStrictNativeCodexReceipt(bad, head), false);
      assert.equal(acceptable(record(bad)), false);
    }
    assert.equal(
      acceptable({ ...record(body), user: { login: "impostor[bot]" } }),
      false,
    );
    assert.equal(
      acceptable({
        ...record(body),
        created_at: "2026-10-20T11:00:00Z",
        updated_at: "2026-10-20T11:00:00Z",
      }),
      false,
    );
  });

const replies = JSON.parse(
  readFileSync(
    new URL("./fixtures/native-codex-clean-replies.json", import.meta.url),
    "utf8",
  ),
);
test("whole observed bodies, including both help footers and task links", () => {
  for (const row of replies) {
    assert.equal(acceptable(record(row.body)), true, row.closing);
    assert.equal(
      acceptable(record(row.body + "\nAuthentication leaks credentials.")),
      false,
      row.closing,
    );
  }
});
