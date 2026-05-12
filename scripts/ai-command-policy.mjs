#!/usr/bin/env node

import { readFileSync } from "node:fs";
import {
  createAiReviewRequestMarkerBody,
  isTrustedAssociation,
} from "./ai-review-helpers.mjs";
import { rerunAiReviewForPrHead } from "./ai-review-rerun.mjs";
import { readConfig } from "./shared.mjs";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const eventPath = process.env.GITHUB_EVENT_PATH;
const config = readConfig();

if (!token || !repository || !eventPath) {
  console.error(
    "GITHUB_TOKEN, GITHUB_REPOSITORY, and GITHUB_EVENT_PATH are required.",
  );
  process.exit(1);
}

const [owner, repo] = repository.split("/");
const event = JSON.parse(readFileSync(eventPath, "utf8"));
const body = event.comment?.body || "";
const bodyLower = body.toLowerCase();
const prNumber = event.issue?.number;
const authorAssociation = event.comment?.author_association;
const commentAuthorType = event.comment?.user?.type;
const commentAuthorLogin = String(
  event.comment?.user?.login || "",
).toLowerCase();
const reviewAgents = new Set(config.reviewAgents || ["codex", "gemini"]);
const implementationAgents = new Set(["claude", "codex"]);

if (
  commentAuthorType === "Bot" ||
  commentAuthorLogin === "github-actions[bot]"
) {
  console.log("AI command ignored: comment was posted by a bot.");
  process.exit(0);
}

function requestedReviewAgent(commandBody) {
  if (commandBody.includes("@codex review")) return "codex";
  if (commandBody.includes("@claude review once")) return "claude";
  if (
    commandBody.includes("/gemini review") ||
    commandBody.includes("@gemini-code-assist review")
  ) {
    return "gemini";
  }
  return null;
}

function requestedImplementationAgent(commandBody) {
  if (commandBody.includes("@claude")) return "claude";
  if (commandBody.includes("@codex")) return "codex";
  return null;
}

async function request(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText}: ${await response.text()}`,
    );
  }
  if (response.status === 204) return null;
  return response.json();
}

async function createComment(commentBody) {
  return request(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body: commentBody }),
  });
}

const requestedReview = requestedReviewAgent(bodyLower);
const isReview = Boolean(requestedReview);
const requestedImplementation = isReview
  ? null
  : requestedImplementationAgent(bodyLower);
const requested = requestedReview || requestedImplementation;
const selected = (
  isReview
    ? process.env.AI_REVIEW_AGENT || config.defaultReviewAgent || "codex"
    : process.env.AI_IMPLEMENTATION_AGENT ||
      config.defaultImplementationAgent ||
      "claude"
)
  .trim()
  .toLowerCase();
const allowed = isReview ? reviewAgents : implementationAgents;

const rejectionLines = [];
if (!event.issue?.pull_request) {
  rejectionLines.push(
    "AI command rejected: this command only runs on pull requests.",
  );
}
if (!isTrustedAssociation(authorAssociation)) {
  rejectionLines.push(
    "AI command rejected: only OWNER, MEMBER, and COLLABORATOR comments are trusted.",
  );
}
if (!requested) {
  rejectionLines.push(
    "AI command rejected: no supported AI command was detected.",
  );
}
if (!allowed.has(selected)) {
  rejectionLines.push(
    `AI command rejected: unsupported selected agent '${selected}'.`,
  );
}
if (isReview && requested && !reviewAgents.has(requested)) {
  rejectionLines.push(
    `AI command rejected: '${requested}' is not an enabled review backend in this repository.`,
  );
}
if (requested && selected !== requested) {
  const expectedReviewCommand =
    selected === "gemini" ? "/gemini review" : "@codex review";
  const expectedImplementationCommand =
    selected === "claude"
      ? "@claude <task brief>"
      : "start the Codex task from Codex app or Codex web";
  rejectionLines.push(
    [
      "Policy mismatch for AI command routing.",
      `Requested ${isReview ? "review" : "implementation"} agent: ${requested}`,
      `Selected ${isReview ? "review" : "implementation"} agent: ${selected}`,
      `Use ${isReview ? expectedReviewCommand : expectedImplementationCommand} or update the repository variable before rerunning the command.`,
    ].join("\n"),
  );
}

if (rejectionLines.length > 0) {
  await createComment(rejectionLines.join("\n\n"));
  console.error(rejectionLines.join(" "));
  process.exit(1);
}

if (isReview) {
  const pull = await request(`/repos/${owner}/${repo}/pulls/${prNumber}`);
  const headSha = pull.head?.sha;
  const sourceCommentId = String(event.comment.id);
  const requestedAt = event.comment.created_at || new Date().toISOString();
  const requestId = `${sourceCommentId}-${String(headSha).slice(0, 12)}`;

  await createComment(
    createAiReviewRequestMarkerBody({
      agent: selected,
      headSha,
      requestId,
      sourceCommentId,
      sourceCommentCreatedAt: event.comment.created_at,
      requestedAt,
    }),
  );

  try {
    const rerunResult = await rerunAiReviewForPrHead({
      token,
      repository,
      headSha,
    });
    console.log(rerunResult.message);
  } catch (error) {
    console.warn(
      `AI Review rerun request failed after marker was recorded: ${error.message}`,
    );
  }
}

console.log(
  `Trusted AI ${isReview ? "review" : "implementation"} command for ${selected}.`,
);
