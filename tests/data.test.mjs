import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test, { afterEach, beforeEach } from "node:test";
import {
  deepStrictEqual,
  match,
  rejects,
  strictEqual,
  throws,
} from "node:assert/strict";

import {
  fetchContributions,
  parseContributionsResponse,
} from "../dist-renderer/data.js";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(here, "fixtures/graphql-sample.json");
const goldenPayload = () => JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
const fixtureDays = () =>
  goldenPayload().data.user.contributionsCollection.contributionCalendar.weeks.flatMap(
    (w) => w.contributionDays,
  );

function wrap(weeks) {
  return {
    data: {
      user: { contributionsCollection: { contributionCalendar: { weeks } } },
    },
  };
}

function zeroedPayload() {
  const p = goldenPayload();
  for (const week of p.data.user.contributionsCollection.contributionCalendar
    .weeks) {
    for (const day of week.contributionDays) {
      day.contributionCount = 0;
    }
  }
  return p;
}

function singleActivityPayload() {
  const p = zeroedPayload();
  const firstWeek =
    p.data.user.contributionsCollection.contributionCalendar.weeks[0];
  firstWeek.contributionDays[0].contributionCount = 7;
  return p;
}

const originalFetch = globalThis.fetch;
let fetchCalls = [];
let fetchImpl = null;

beforeEach(() => {
  fetchCalls = [];
  fetchImpl = null;
  globalThis.fetch = async (url, init) => {
    fetchCalls.push({ url, init });
    if (!fetchImpl) {
      throw new Error("fetch stub not configured for this test");
    }
    return fetchImpl(url, init);
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    },
  };
}

test("parser: golden fixture → length matches, chronological, counts integer ≥ 0", () => {
  const days = parseContributionsResponse(goldenPayload());
  const expected = fixtureDays();
  strictEqual(days.length, expected.length);
  strictEqual(days.length > 0, true);
  for (let i = 0; i < days.length; i += 1) {
    strictEqual(days[i].date, expected[i].date);
    strictEqual(days[i].count, expected[i].contributionCount);
    strictEqual(Number.isInteger(days[i].count), true);
    strictEqual(days[i].count >= 0, true);
    if (i > 0) {
      strictEqual(days[i - 1].date < days[i].date, true);
    }
  }
});

test("parser: zeroed payload → same length, all zeros", () => {
  const days = parseContributionsResponse(zeroedPayload());
  strictEqual(days.length, fixtureDays().length);
  strictEqual(
    days.every((d) => d.count === 0),
    true,
  );
});

test("parser: single-day-with-activity → exactly one count > 0", () => {
  const days = parseContributionsResponse(singleActivityPayload());
  strictEqual(days.filter((d) => d.count > 0).length, 1);
  strictEqual(days.find((d) => d.count > 0).count, 7);
});

test("parser: rejects payload with data.user = null", () => {
  throws(
    () => parseContributionsResponse({ data: { user: null } }),
    /user not found/,
  );
});

test("parser: empty weeks array → empty result", () => {
  const days = parseContributionsResponse(wrap([]));
  deepStrictEqual(days, []);
});

test("parser: rejects missing data object", () => {
  throws(() => parseContributionsResponse({}), /missing data/);
});

test("parser: rejects non-integer contributionCount", () => {
  const bad = wrap([
    { contributionDays: [{ date: "2026-01-01", contributionCount: 1.5 }] },
  ]);
  throws(() => parseContributionsResponse(bad), /integer/);
});

test("parser: rejects negative contributionCount", () => {
  const bad = wrap([
    { contributionDays: [{ date: "2026-01-01", contributionCount: -1 }] },
  ]);
  throws(() => parseContributionsResponse(bad), /integer/);
});

test("parser: determinism — two calls return deepEqual arrays", () => {
  const a = parseContributionsResponse(goldenPayload());
  const b = parseContributionsResponse(goldenPayload());
  deepStrictEqual(a, b);
});

test("fetch: POST sends correct URL, headers, and body shape", async () => {
  fetchImpl = async () => jsonResponse(goldenPayload());
  await fetchContributions("kiaquila", "secret-token-abc");
  strictEqual(fetchCalls.length, 1);
  const call = fetchCalls[0];
  strictEqual(call.url, "https://api.github.com/graphql");
  strictEqual(call.init.method, "POST");
  strictEqual(call.init.headers.Authorization, "bearer secret-token-abc");
  strictEqual(call.init.headers["Content-Type"], "application/json");
  const body = JSON.parse(call.init.body);
  match(body.query, /contributionsCollection/);
  strictEqual(body.variables.login, "kiaquila");
  strictEqual(typeof body.variables.from, "string");
  strictEqual(typeof body.variables.to, "string");
});

test("fetch: rolling 371-day window respects injected now", async () => {
  fetchImpl = async () => jsonResponse(goldenPayload());
  const now = new Date("2026-04-21T12:00:00Z");
  await fetchContributions("kiaquila", "t", { now });
  const body = JSON.parse(fetchCalls[0].init.body);
  strictEqual(body.variables.to, "2026-04-21T12:00:00.000Z");
  // Inclusive 371-day window: from = now - 370 days.
  strictEqual(body.variables.from, "2025-04-16T12:00:00.000Z");
});

test("fetch: HTTP 401 throws with status in message", async () => {
  fetchImpl = async () =>
    jsonResponse({ message: "Bad credentials" }, { status: 401 });
  await rejects(fetchContributions("kiaquila", "bad-token"), /HTTP 401/);
});

test("fetch: HTTP 403 with x-ratelimit-remaining=0 mentions rate limit", async () => {
  fetchImpl = async () =>
    jsonResponse(
      { message: "API rate limit exceeded" },
      { status: 403, headers: { "x-ratelimit-remaining": "0" } },
    );
  await rejects(fetchContributions("kiaquila", "t"), /rate limit/);
});

test("fetch: 200 body with errors[] throws with joined message", async () => {
  fetchImpl = async () =>
    jsonResponse({
      errors: [{ message: "first problem" }, { message: "second problem" }],
    });
  await rejects(
    fetchContributions("kiaquila", "t"),
    /first problem; second problem/,
  );
});

test("fetch: 200 body with data.user=null throws user-not-found", async () => {
  fetchImpl = async () => jsonResponse({ data: { user: null } });
  await rejects(
    fetchContributions("ghost-user-404", "t"),
    /user not found: ghost-user-404/,
  );
});

test("fetch: malformed JSON body throws wrapper error", async () => {
  fetchImpl = async () => ({
    ok: true,
    status: 200,
    headers: new Headers(),
    async json() {
      throw new SyntaxError("Unexpected token");
    },
    async text() {
      return "not json";
    },
  });
  await rejects(fetchContributions("kiaquila", "t"), /malformed JSON/);
});
