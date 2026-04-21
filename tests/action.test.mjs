import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test, { afterEach, beforeEach } from "node:test";
import { ok, strictEqual } from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(here, "fixtures/graphql-sample.json");

function goldenPayload() {
  return JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
}

// ---------------------------------------------------------------------------
// Import action module once (ESM cache).
// We mutate properties on the exported `_fns` object — object property
// mutation is allowed even on ESM namespace objects.
// ---------------------------------------------------------------------------
import { run, _fns } from "../dist-renderer/action.js";

// Save the original fn implementations so afterEach can restore them.
const originalExec = _fns.exec;
const originalSetFailed = _fns.setFailed;
const originalSetSecret = _fns.setSecret;
const originalInfo = _fns.info;

// ---------------------------------------------------------------------------
// Per-test capture arrays
// ---------------------------------------------------------------------------
let setFailedCalls = [];
let setSecretCalls = [];
let infoCalls = [];
let execCalls = [];

// ---------------------------------------------------------------------------
// Env save/restore
// ---------------------------------------------------------------------------
const ENV_KEYS = [
  "INPUT_USERNAME",
  "INPUT_TOKEN",
  "INPUT_REDUCED",
  "INPUT_BRANCH",
  "GITHUB_REPOSITORY",
  "GITHUB_TOKEN",
  "COMET_DRY_RUN",
];
let savedEnv = {};

function setupEnv(overrides = {}) {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  const defaults = {
    INPUT_USERNAME: "kiaquila",
    INPUT_TOKEN: "test-token-abc",
    INPUT_REDUCED: "false",
    INPUT_BRANCH: "comet-graph",
    GITHUB_REPOSITORY: "owner/repo",
    COMET_DRY_RUN: "1",
  };
  const merged = { ...defaults, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined) process.env[k] = v;
  }
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v !== undefined) {
      process.env[k] = v;
    }
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
const originalFetch = globalThis.fetch;

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
  }

  setFailedCalls = [];
  setSecretCalls = [];
  infoCalls = [];
  execCalls = [];

  // Stub _fns properties (object property mutation — allowed on ESM exports).
  _fns.setFailed = (msg) => {
    setFailedCalls.push(String(msg));
  };
  _fns.setSecret = (secret) => {
    setSecretCalls.push(String(secret));
  };
  _fns.info = (msg) => {
    infoCalls.push(String(msg));
  };
  _fns.exec = async (cmd, args, _opts) => {
    execCalls.push([cmd, ...args]);
    return 0;
  };

  // Stub fetch to return golden fixture.
  globalThis.fetch = async (_url, _init) => {
    const payload = goldenPayload();
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      async json() {
        return payload;
      },
      async text() {
        return JSON.stringify(payload);
      },
    };
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  _fns.exec = originalExec;
  _fns.setFailed = originalSetFailed;
  _fns.setSecret = originalSetSecret;
  _fns.info = originalInfo;
  restoreEnv();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("renders only comet.svg when INPUT_REDUCED=false", async () => {
  setupEnv({ INPUT_REDUCED: "false", COMET_DRY_RUN: "0" });
  await run();
  strictEqual(
    setFailedCalls.length,
    0,
    `setFailed was called: ${setFailedCalls.join("; ")}`,
  );
  const addCall = execCalls.find(
    ([cmd, sub]) => cmd === "git" && sub === "add",
  );
  ok(addCall, "git add must be called");
  ok(addCall.includes("comet.svg"), "git add must include comet.svg");
  strictEqual(
    addCall.includes("comet-reduced.svg"),
    false,
    "git add must NOT include comet-reduced.svg",
  );
});

test("renders comet.svg + comet-reduced.svg when INPUT_REDUCED=true", async () => {
  setupEnv({ INPUT_REDUCED: "true", COMET_DRY_RUN: "0" });
  await run();
  strictEqual(
    setFailedCalls.length,
    0,
    `setFailed was called: ${setFailedCalls.join("; ")}`,
  );
  const addCall = execCalls.find(
    ([cmd, sub]) => cmd === "git" && sub === "add",
  );
  ok(addCall, "git add must be called");
  ok(addCall.includes("comet.svg"), "must include comet.svg");
  ok(addCall.includes("comet-reduced.svg"), "must include comet-reduced.svg");
});

test("INPUT_REDUCED omitted defaults to true — both files produced", async () => {
  setupEnv({ INPUT_REDUCED: "", COMET_DRY_RUN: "0" });
  await run();
  strictEqual(
    setFailedCalls.length,
    0,
    `setFailed was called: ${setFailedCalls.join("; ")}`,
  );
  const addCall = execCalls.find(
    ([cmd, sub]) => cmd === "git" && sub === "add",
  );
  ok(addCall, "git add must be called");
  ok(addCall.includes("comet-reduced.svg"), "omitted reduced → both files");
});

test("missing INPUT_USERNAME → setFailed with message mentioning username", async () => {
  setupEnv({ INPUT_USERNAME: "" });
  await run();
  ok(setFailedCalls.length > 0, "setFailed must be called");
  ok(
    setFailedCalls.some((m) => m.toLowerCase().includes("username")),
    `expected 'username' in setFailed, got: ${setFailedCalls.join("; ")}`,
  );
  strictEqual(execCalls.length, 0, "no exec calls should happen");
});

test("missing INPUT_TOKEN and GITHUB_TOKEN → setFailed with token message", async () => {
  setupEnv({ INPUT_TOKEN: "" });
  delete process.env.GITHUB_TOKEN;
  await run();
  ok(setFailedCalls.length > 0, "setFailed must be called");
  ok(
    setFailedCalls.some((m) => m.toLowerCase().includes("token")),
    `expected 'token' in setFailed, got: ${setFailedCalls.join("; ")}`,
  );
  strictEqual(execCalls.length, 0, "no exec calls should happen");
});

test("username with invalid chars → setFailed, no fetch issued", async () => {
  setupEnv({ INPUT_USERNAME: "--flag-injection" });
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return {};
  };
  await run();
  ok(setFailedCalls.length > 0, "setFailed must be called");
  ok(
    setFailedCalls.some((m) => m.toLowerCase().includes("username")),
    `expected validation message about username, got: ${setFailedCalls.join("; ")}`,
  );
  strictEqual(
    fetchCalled,
    false,
    "fetch must not be called on invalid username",
  );
});

test("branch with invalid chars → setFailed, no fetch issued", async () => {
  setupEnv({ INPUT_BRANCH: "bad branch!" });
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return {};
  };
  await run();
  ok(setFailedCalls.length > 0, "setFailed must be called");
  ok(
    setFailedCalls.some((m) => m.toLowerCase().includes("branch")),
    `expected validation message about branch, got: ${setFailedCalls.join("; ")}`,
  );
  strictEqual(fetchCalled, false, "fetch must not be called on invalid branch");
});

test("fetchContributions throws → setFailed propagates the thrown message", async () => {
  setupEnv();
  globalThis.fetch = async () => {
    throw new Error("network-failure-xyz");
  };
  await run();
  ok(setFailedCalls.length > 0, "setFailed must be called");
  ok(
    setFailedCalls.some((m) => m.includes("network-failure-xyz")),
    `expected error message in setFailed, got: ${setFailedCalls.join("; ")}`,
  );
});

test("git sequence: init → config.name → config.email → checkout --orphan → add → commit → push", async () => {
  setupEnv({ INPUT_REDUCED: "false", COMET_DRY_RUN: "0" });
  await run();
  strictEqual(
    setFailedCalls.length,
    0,
    `setFailed: ${setFailedCalls.join("; ")}`,
  );

  const seqLabels = execCalls.map((args) => args.slice(0, 3).join(" "));

  const initIdx = seqLabels.findIndex((c) => c.includes("git init"));
  const configNameIdx = seqLabels.findIndex(
    (c) => c === "git config user.name",
  );
  const configEmailIdx = seqLabels.findIndex(
    (c) => c === "git config user.email",
  );
  const orphanIdx = seqLabels.findIndex((c) =>
    c.includes("git checkout --orphan"),
  );
  const addIdx = seqLabels.findIndex((c) => c === "git add comet.svg");
  const commitIdx = seqLabels.findIndex((c) =>
    c.includes("git commit --quiet"),
  );
  const pushIdx = seqLabels.findIndex((c) => c.includes("git push --force"));

  ok(initIdx !== -1, "git init must be called");
  ok(configNameIdx > initIdx, "config user.name must follow init");
  ok(
    configEmailIdx > configNameIdx,
    "config user.email must follow config user.name",
  );
  ok(orphanIdx > configEmailIdx, "checkout --orphan must follow config");
  ok(addIdx > orphanIdx, "git add must follow checkout --orphan");
  ok(commitIdx > addIdx, "git commit must follow git add");
  ok(pushIdx > commitIdx, "git push must follow git commit");
});

test("push URL embeds x-access-token:<token>@github.com, not Authorization header", async () => {
  setupEnv({ INPUT_REDUCED: "false", COMET_DRY_RUN: "0" });
  await run();
  strictEqual(
    setFailedCalls.length,
    0,
    `setFailed: ${setFailedCalls.join("; ")}`,
  );

  const pushCall = execCalls.find(
    ([cmd, sub]) => cmd === "git" && sub === "push",
  );
  ok(pushCall, "git push must be called");
  const urlArg = pushCall.find((a) => a.startsWith("https://"));
  ok(urlArg, "push must have an https URL argument");
  ok(
    urlArg.startsWith("https://x-access-token:"),
    "URL must use x-access-token auth",
  );
  ok(
    !urlArg.includes("Authorization"),
    "URL must not contain Authorization header",
  );
  ok(
    urlArg.includes("github.com/owner/repo.git"),
    "URL must reference correct repo",
  );
});

test("core.setSecret called with token before first exec", async () => {
  setupEnv({ INPUT_REDUCED: "false", COMET_DRY_RUN: "0" });

  let setSecretCalledBeforeFirstExec = false;
  let execCallCount = 0;
  _fns.exec = async (cmd, args, _opts) => {
    if (execCallCount === 0 && setSecretCalls.includes("test-token-abc")) {
      setSecretCalledBeforeFirstExec = true;
    }
    execCallCount++;
    execCalls.push([cmd, ...args]);
    return 0;
  };

  await run();
  strictEqual(
    setFailedCalls.length,
    0,
    `setFailed: ${setFailedCalls.join("; ")}`,
  );
  ok(
    setSecretCalls.includes("test-token-abc"),
    "setSecret must be called with the token",
  );
  ok(
    setSecretCalledBeforeFirstExec,
    "setSecret must be called before first exec",
  );
});

test("GITHUB_REPOSITORY missing → setFailed, no push attempted", async () => {
  setupEnv();
  delete process.env.GITHUB_REPOSITORY;
  await run();
  ok(setFailedCalls.length > 0, "setFailed must be called");
  ok(
    setFailedCalls.some((m) => m.toLowerCase().includes("github_repository")),
    `expected GITHUB_REPOSITORY mention in setFailed, got: ${setFailedCalls.join("; ")}`,
  );
  const pushCall = execCalls.find(
    ([cmd, sub]) => cmd === "git" && sub === "push",
  );
  strictEqual(pushCall, undefined, "git push must not be called");
});

test("exec rejects on git push → setFailed propagates the error message", async () => {
  setupEnv({ INPUT_REDUCED: "false", COMET_DRY_RUN: "0" });
  _fns.exec = async (cmd, args, _opts) => {
    execCalls.push([cmd, ...args]);
    if (args[0] === "push") {
      throw new Error("git-push-auth-failure-xyz");
    }
    return 0;
  };
  await run();
  ok(setFailedCalls.length > 0, "setFailed must be called");
  ok(
    setFailedCalls.some((m) => m.includes("git-push-auth-failure-xyz")),
    `expected exec rejection message in setFailed, got: ${setFailedCalls.join("; ")}`,
  );
  // init/config/checkout/add/commit happened before push; push is the 7th call.
  const pushCall = execCalls.find(
    ([cmd, sub]) => cmd === "git" && sub === "push",
  );
  ok(pushCall, "push must have been attempted before rejection");
});

test("COMET_DRY_RUN=1 skips real exec and logs <token> literal, not real token", async () => {
  setupEnv({ INPUT_REDUCED: "false", COMET_DRY_RUN: "1" });
  await run();
  strictEqual(
    setFailedCalls.length,
    0,
    `setFailed: ${setFailedCalls.join("; ")}`,
  );
  strictEqual(execCalls.length, 0, "no exec calls in dry-run mode");
  const joinedInfo = infoCalls.join("\n");
  ok(
    joinedInfo.includes("[dry-run]"),
    "info output must include [dry-run] prefix",
  );
  ok(
    joinedInfo.includes("<token>"),
    "info output must contain <token> literal for redaction",
  );
  ok(
    !joinedInfo.includes("test-token-abc"),
    "info output must NOT contain the real token value",
  );
});
