import type { ContributionDay, FetchOptions } from "./types.js";

const ENDPOINT = "https://api.github.com/graphql";
const USER_AGENT = "comet-contribution-graph/0.1";
const WINDOW_DAYS = 371;

const QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks {
          contributionDays { date contributionCount }
        }
      }
    }
  }
}`;

export async function fetchContributions(
  username: string,
  token: string,
  opts: FetchOptions = {},
): Promise<ContributionDay[]> {
  const now = opts.now ?? new Date();
  const { from, to } = computeWindow(now);
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { login: username, from, to },
    }),
  });

  if (!response.ok) {
    const body = (await safeText(response)).slice(0, 500);
    const rateRemaining = response.headers.get("x-ratelimit-remaining");
    const rateSuffix =
      response.status === 403 && rateRemaining === "0"
        ? " (rate limit exhausted)"
        : "";
    throw new Error(
      `GitHub API request failed: HTTP ${response.status}${rateSuffix}`,
      { cause: { status: response.status, bodyExcerpt: body } },
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (cause) {
    throw new Error("GitHub API returned malformed JSON", { cause });
  }

  if (isObj(payload)) {
    const errs = payload["errors"];
    if (Array.isArray(errs) && errs.length > 0) {
      const joined = errs
        .map((e) =>
          isObj(e) && typeof e["message"] === "string"
            ? e["message"]
            : "(no message)",
        )
        .join("; ");
      throw new Error(`GitHub GraphQL returned errors: ${joined}`, {
        cause: errs,
      });
    }
    const data = payload["data"];
    if (isObj(data) && data["user"] === null) {
      throw new Error(`GitHub user not found: ${username}`);
    }
  }

  return parseContributionsResponse(payload);
}

export function parseContributionsResponse(
  payload: unknown,
): ContributionDay[] {
  if (!isObj(payload)) {
    throw new Error("invalid payload: expected top-level object");
  }
  const data = payload["data"];
  if (!isObj(data)) {
    throw new Error("invalid payload: missing data");
  }
  const user = data["user"];
  if (user === null) {
    throw new Error("GitHub user not found (data.user is null)");
  }
  if (!isObj(user)) {
    throw new Error("invalid payload: missing data.user");
  }
  const collection = user["contributionsCollection"];
  if (!isObj(collection)) {
    throw new Error("invalid payload: missing contributionsCollection");
  }
  const calendar = collection["contributionCalendar"];
  if (!isObj(calendar)) {
    throw new Error("invalid payload: missing contributionCalendar");
  }
  const weeks = calendar["weeks"];
  if (!Array.isArray(weeks)) {
    throw new Error("invalid payload: weeks is not an array");
  }

  const out: ContributionDay[] = [];
  for (const week of weeks) {
    if (!isObj(week)) {
      throw new Error("invalid payload: week is not an object");
    }
    const days = week["contributionDays"];
    if (!Array.isArray(days)) {
      throw new Error("invalid payload: contributionDays is not an array");
    }
    for (const day of days) {
      if (!isObj(day)) {
        throw new Error("invalid payload: day is not an object");
      }
      const date = day["date"];
      const count = day["contributionCount"];
      if (typeof date !== "string") {
        throw new Error("invalid payload: day.date is not a string");
      }
      if (
        typeof count !== "number" ||
        !Number.isInteger(count) ||
        count < 0
      ) {
        throw new Error(
          `invalid payload: contributionCount is not an integer ≥ 0 (got ${String(count)})`,
        );
      }
      out.push({ date, count });
    }
  }
  return out;
}

function computeWindow(now: Date): { from: string; to: string } {
  const to = new Date(now.getTime());
  const from = new Date(now.getTime());
  from.setUTCDate(from.getUTCDate() - WINDOW_DAYS);
  return { from: from.toISOString(), to: to.toISOString() };
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
