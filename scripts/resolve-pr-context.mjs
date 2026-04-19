#!/usr/bin/env node

import { appendFileSync, readFileSync } from "node:fs";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const eventPath = process.env.GITHUB_EVENT_PATH;
const explicitPrNumber = process.env.AI_REVIEW_PR_NUMBER;
const outputPath = process.env.GITHUB_OUTPUT;

if (!repository) {
  throw new Error("GITHUB_REPOSITORY is required");
}

if (!eventPath) {
  throw new Error("GITHUB_EVENT_PATH is required");
}

const [owner, repo] = repository.split("/");
const event = JSON.parse(readFileSync(eventPath, "utf8"));

const setOutput = (name, value) => {
  if (!outputPath) {
    return;
  }

  appendFileSync(outputPath, `${name}=${String(value)}\n`);
};

const prNumber =
  explicitPrNumber ||
  event.pull_request?.number ||
  (event.issue?.pull_request ? event.issue.number : "") ||
  event.review?.pull_request_url?.split("/").pop() ||
  "";

if (!prNumber) {
  setOutput("is_pull_request", "false");
  console.log(JSON.stringify({ isPullRequest: false }));
  process.exit(0);
}

if (!token) {
  throw new Error("GITHUB_TOKEN is required to resolve pull request context");
}

const response = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
  {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  },
);

if (!response.ok) {
  throw new Error(
    `Failed to resolve PR #${prNumber}: ${response.status} ${response.statusText}`,
  );
}

const pull = await response.json();
const result = {
  isPullRequest: true,
  prNumber: String(pull.number),
  headRef: pull.head.ref,
  headSha: pull.head.sha,
  headRepository: pull.head.repo.full_name,
  baseRef: pull.base.ref,
  baseRepository: pull.base.repo.full_name,
  isFork: pull.head.repo.full_name !== `${owner}/${repo}`,
  checkoutRef: `refs/pull/${pull.number}/head`,
};

setOutput("is_pull_request", "true");
setOutput("pr_number", result.prNumber);
setOutput("head_ref", result.headRef);
setOutput("head_sha", result.headSha);
setOutput("head_repository", result.headRepository);
setOutput("base_ref", result.baseRef);
setOutput("base_repository", result.baseRepository);
setOutput("is_fork", result.isFork ? "true" : "false");
setOutput("checkout_ref", result.checkoutRef);

console.log(JSON.stringify(result));
