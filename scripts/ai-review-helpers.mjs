import { isStrictNativeCodexReceipt } from "./codex-native-receipt.mjs";
export const trustedAssociations = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export function isTrustedAssociation(value) {
  return trustedAssociations.has(String(value || "").toUpperCase());
}

export function extractClaudeOutcome(body) {
  const match = String(body || "").match(
    /^AI_REVIEW_OUTCOME:\s*(pass|advisory|block)\s*$/im,
  );
  return match?.[1]?.toLowerCase() || null;
}

export function extractMarkerSha(body) {
  const match = String(body || "").match(
    /^AI_REVIEW_SHA:\s*([a-f0-9]{7,40})\s*$/im,
  );
  return match?.[1] || null;
}

export function createAiReviewRequestMarkerBody({
  agent,
  headSha,
  requestId,
  sourceCommentId,
  sourceCommentCreatedAt,
  requestedAt,
}) {
  const recordedAt = requestedAt || new Date().toISOString();
  return [
    `AI review request recorded for \`${String(headSha || "").slice(0, 10)}\`.`,
    "",
    "<!-- comet:ai-review-request",
    `AI_REVIEW_REQUEST_ID: ${requestId}`,
    `AI_REVIEW_AGENT: ${String(agent || "")
      .trim()
      .toLowerCase()}`,
    `AI_REVIEW_SHA: ${headSha}`,
    `AI_REVIEW_SOURCE_COMMENT_ID: ${sourceCommentId}`,
    `AI_REVIEW_SOURCE_COMMENT_CREATED_AT: ${sourceCommentCreatedAt || recordedAt}`,
    `AI_REVIEW_REQUESTED_AT: ${recordedAt}`,
    "-->",
  ].join("\n");
}

export function extractAiReviewRequestMarker(body) {
  const text = String(body || "");
  const hasKnownMarker = [
    "comet:ai-review-request",
    "unicorn-hub:ai-review-request",
  ].some((marker) => text.includes(marker));
  if (!hasKnownMarker) return null;

  const field = (name) =>
    text.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, "im"))?.[1]?.trim() ||
    null;
  const requestId = field("AI_REVIEW_REQUEST_ID");
  const agent = field("AI_REVIEW_AGENT")?.toLowerCase();
  const sha = field("AI_REVIEW_SHA");
  const sourceCommentId = field("AI_REVIEW_SOURCE_COMMENT_ID");
  const sourceCommentCreatedAt = field("AI_REVIEW_SOURCE_COMMENT_CREATED_AT");
  const requestedAt = field("AI_REVIEW_REQUESTED_AT");

  if (!requestId || !agent || !sha || !sourceCommentId || !requestedAt)
    return null;
  if (!/^[a-f0-9]{7,40}$/i.test(sha)) return null;

  return {
    requestId,
    agent,
    sha,
    sourceCommentId,
    sourceCommentCreatedAt,
    requestedAt,
  };
}

export function normalizeLogin(login) {
  return String(login || "").toLowerCase();
}

export function aiReviewMarkerAuthorLogin(config = {}) {
  return normalizeLogin(
    config.aiReviewMarkerAuthorLogin || "github-actions[bot]",
  );
}

export function trustedAiReviewMarkerAuthorLogins(config = {}) {
  return new Set(
    ["github-actions[bot]", aiReviewMarkerAuthorLogin(config)].map(
      normalizeLogin,
    ),
  );
}

export function isTrustedAiReviewMarkerAuthorLogin(login, config = {}) {
  return trustedAiReviewMarkerAuthorLogins(config).has(normalizeLogin(login));
}

const defaultTrustedReviewLogins = {
  codex: ["chatgpt-codex-connector[bot]"],
  claude: ["claude[bot]"],
  gemini: ["gemini-code-assist[bot]"],
};

export function trustedReviewLoginsForAgent(agent, config = {}) {
  return new Set(
    [
      ...(defaultTrustedReviewLogins[agent] || []),
      ...(config.trustedReviewLogins || []),
      ...(config.trustedReviewLoginsByAgent?.[agent] || []),
    ].map(normalizeLogin),
  );
}

export function isTrustedReviewLogin(login, agent, config = {}) {
  return trustedReviewLoginsForAgent(agent, config).has(normalizeLogin(login));
}

export function isAiReviewRequestMarkerComment(
  comment,
  agent,
  headSha,
  config = {},
) {
  const login = normalizeLogin(comment?.user?.login);
  if (!isTrustedAiReviewMarkerAuthorLogin(login, config)) return false;
  const marker = extractAiReviewRequestMarker(comment?.body);
  if (!marker) return false;
  return (
    marker.agent === String(agent || "").toLowerCase() && marker.sha === headSha
  );
}

export function latestAiReviewRequestMarker(
  comments = [],
  agent,
  headSha,
  config = {},
) {
  return (
    comments
      .map((comment) => {
        const marker = extractAiReviewRequestMarker(comment?.body);
        if (!marker) return null;
        return {
          ...marker,
          commentId: String(comment.id || ""),
          commentCreatedAt: comment.created_at || null,
          author: comment.user?.login || null,
        };
      })
      .filter(
        (marker) =>
          marker &&
          isTrustedAiReviewMarkerAuthorLogin(marker.author, config) &&
          marker.agent === String(agent || "").toLowerCase() &&
          marker.sha === headSha,
      )
      .sort(
        (left, right) =>
          Date.parse(right.commentCreatedAt || right.requestedAt || "") -
          Date.parse(left.commentCreatedAt || left.requestedAt || ""),
      )[0] || null
  );
}

export function containsBlockingSeverity(body, agent) {
  const text = String(body || "");
  if (agent === "codex") {
    return /\bP[0-2]\b/i.test(text);
  }
  if (agent === "gemini") {
    return extractGeminiSeverities(text).some((severity) =>
      ["critical", "high", "medium"].includes(severity),
    );
  }
  // Claude reviews are gated by AI_REVIEW_OUTCOME, not by severity prose.
  return false;
}

function extractGeminiSeverities(body) {
  const text = String(body || "");
  const patterns = [
    /(?:^|[^\w])(?:\*\*)?(?:severity|priority|risk|impact)(?:\*\*)?\s*[:：-]\s*(?:\*\*)?\s*(critical|high|medium|low)(?:\*\*)?\b/gi,
    /(?:^|[\n\r])\s*(?:[-*]\s*)?(?:\*\*)?\s*(critical|high|medium|low)\s*(?:\*\*)?\s*[:：-](?:\*\*)?/gi,
    /\[(critical|high|medium|low)\]/gi,
    /(?:^|[^\w])(?:\*\*)?(critical|high|medium|low)(?:\*\*)?\s+(?:\*\*)?(?:severity|priority|risk|impact|finding|issue)(?:\*\*)?\b/gi,
  ];
  const severities = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      severities.push(match[1].toLowerCase());
    }
  }
  return severities;
}

export function extractCodexPriority(body) {
  const match = String(body || "").match(/\bP([0-3])\b/i);
  return match ? Number(match[1]) : null;
}

// Signals wake evaluation; only the classifiers below can establish a verdict.
export function isCodexReviewCommentSignal(body) {
  return /^(?:Codex Review:|<!-- codex-review-receipt:|<!-- codex-pull-request-review-summary)/i.test(
    String(body || "").trim(),
  );
}

export function reviewCommentTimestamp(comment) {
  return comment?.updated_at || comment?.created_at;
}

export function isAcceptableCodexSummaryComment(
  comment,
  headSha,
  requestMarker = null,
  config = {},
) {
  if (
    !isTrustedReviewLogin(comment?.user?.login, "codex", config) ||
    !isStrictNativeCodexReceipt(comment?.body, headSha, {
      allowUnboundLegacy: true,
    })
  )
    return false;
  const bound =
    /\*\*Reviewed commit:\*\*|major issues for [a-f0-9]{10,40}\./i.test(
      comment.body,
    );
  if (!requestMarker) return bound;
  if (requestMarker.agent !== "codex" || requestMarker.sha !== headSha)
    return false;
  const requested = Date.parse(
    requestMarker.sourceCommentCreatedAt ||
      requestMarker.requestedAt ||
      requestMarker.commentCreatedAt ||
      "",
  );
  const created = Date.parse(comment.created_at || "");
  return (
    Number.isFinite(requested) &&
    Number.isFinite(created) &&
    created >= requested
  );
}

export function evaluateCodexReviewEvidence({
  reviews = [],
  reviewComments = [],
  comments = [],
  threads = [],
  timeline = [],
  headSha,
  requestMarker,
  config = {},
}) {
  // Findings on any head remain blocking while their native thread is open.
  if (
    threads.some(
      (thread) =>
        !thread.isResolved &&
        thread.comments.nodes.some(
          (comment) =>
            isTrustedReviewLogin(comment.author?.login, "codex", config) &&
            (containsBlockingSeverity(comment.body, "codex") ||
              extractCodexPriority(comment.body) === null),
        ),
    )
  )
    return "fail";

  const evidence = reviews
    .map((review) => ({
      result: classifyCodexNativeReview(
        review,
        reviewComments,
        headSha,
        config,
      ),
      at: review.submitted_at,
    }))
    .filter((entry) => entry.result !== null);
  const triggerAt =
    requestMarker?.sourceCommentCreatedAt ||
    requestMarker?.requestedAt ||
    requestMarker?.commentCreatedAt;
  for (const comment of comments) {
    const body = String(comment.body || "").trim();
    if (
      !isTrustedReviewLogin(comment.user?.login, "codex", config) ||
      !isCodexReviewCommentSignal(body) ||
      body.startsWith("<!-- codex-pull-request-review-summary")
    )
      continue;
    const at = reviewCommentTimestamp(comment);
    const shas = [
      ...body.split(/<details>/i)[0].matchAll(/\b[a-f0-9]{7,40}\b/gi),
    ].map((match) => match[0]);
    const namesHead = shas.some(
      (sha) =>
        (sha.length === 10 || sha.length === 40) && headSha.startsWith(sha),
    );
    const afterRequest =
      requestMarker?.sha === headSha && Date.parse(at) >= Date.parse(triggerAt);
    if (!afterRequest || (!namesHead && shas.length > 0)) continue;
    let result = "pending";
    if (
      isAcceptableCodexSummaryComment(
        comment,
        headSha,
        requestMarker,
        config,
      ) &&
      (namesHead ||
        !hasHeadUpdateBetweenTimestamps(
          timeline,
          triggerAt,
          comment.created_at,
        ))
    )
      result = "pass";
    else if (containsBlockingSeverity(body.split(/<details>/i)[0], "codex"))
      result = "fail";
    evidence.push({ result, at });
  }
  // A newer non-passing result cannot be hidden by an older no-findings comment.
  // On timestamp ties prefer failure, then pending, over success.
  const rank = { fail: 0, pending: 1, pass: 2 };
  evidence.sort(
    (left, right) =>
      Date.parse(right.at || "") - Date.parse(left.at || "") ||
      rank[left.result] - rank[right.result],
  );
  return evidence[0]?.result || (requestMarker ? "pending" : "missing_marker");
}

export function hasHeadUpdateBetweenTimestamps(
  timeline = [],
  startCreatedAt,
  endCreatedAt,
) {
  const startTime = Date.parse(startCreatedAt || "");
  const endTime = Date.parse(endCreatedAt || "");
  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    startTime > endTime
  )
    return true;
  return timeline.some((event) => {
    if (event.event !== "committed" && event.event !== "head_ref_force_pushed")
      return false;
    const eventTime = Date.parse(
      event.created_at || event.committer?.date || "",
    );
    return (
      Number.isFinite(eventTime) &&
      eventTime > startTime &&
      eventTime <= endTime
    );
  });
}

export function classifyCodexNativeReview(
  review,
  reviewComments = [],
  headSha,
  config = {},
) {
  if (!review) return null;
  if (!headSha || review.commit_id !== headSha) return null;
  const login = normalizeLogin(review.user?.login);
  if (!isTrustedReviewLogin(login, "codex", config)) return null;

  if (review.state === "CHANGES_REQUESTED") return "fail";
  // Inspect inline severities for any submitted-acceptance state so that an
  // `APPROVED` review with inline P0-P2 or untagged findings still fails.
  // Non-submitted states (DISMISSED/PENDING) are not evidence even when the
  // review body still carries an old severity tag.
  if (!["APPROVED", "COMMENTED"].includes(review.state)) return null;
  if (containsBlockingSeverity(review.body, "codex")) return "fail";

  const commentsForReview = reviewComments.filter(
    (comment) =>
      comment.pull_request_review_id === review.id &&
      isTrustedReviewLogin(comment.user?.login, "codex", config),
  );
  if (commentsForReview.length === 0) return "pass";

  const priorities = commentsForReview.map((comment) =>
    extractCodexPriority(comment.body),
  );
  if (
    priorities.some((priority) => priority === null) ||
    commentsForReview.some((comment) =>
      containsBlockingSeverity(comment.body, "codex"),
    )
  )
    return "fail";
  return Math.min(...priorities) <= 2 ? "fail" : "pass";
}

export function latestCodexNativeReviewResult(
  reviews = [],
  reviewComments = [],
  headSha,
  config = {},
) {
  return (
    reviews
      .map((review) => ({
        review,
        result: classifyCodexNativeReview(
          review,
          reviewComments,
          headSha,
          config,
        ),
      }))
      .filter((entry) => entry.result !== null)
      .sort(
        (left, right) =>
          Date.parse(right.review.submitted_at || "") -
          Date.parse(left.review.submitted_at || ""),
      )[0]?.result || null
  );
}

export function classifyGeminiNativeReview(
  review,
  reviewComments = [],
  headSha,
  config = {},
) {
  if (!review) return null;
  if (review.commit_id && headSha && review.commit_id !== headSha) return null;
  const login = normalizeLogin(review.user?.login);
  if (!isTrustedReviewLogin(login, "gemini", config)) return null;
  // Only submitted review states carry acceptance signal. Dismissed and
  // pending reviews are not evidence: GitHub returns them with their original
  // commit_id, so they would otherwise fall through to a passing classification.
  if (!["APPROVED", "CHANGES_REQUESTED", "COMMENTED"].includes(review.state))
    return null;
  if (review.state === "CHANGES_REQUESTED") return "fail";
  if (containsBlockingSeverity(review.body, "gemini")) return "fail";

  const inlineFromGemini = reviewComments.filter(
    (comment) =>
      comment.pull_request_review_id === review.id &&
      isTrustedReviewLogin(comment.user?.login, "gemini", config),
  );
  // Mirror the Codex inline-severity contract: any trusted inline finding
  // that does not declare a recognized severity is treated as blocking so
  // an untagged or reformatted Gemini comment cannot satisfy AI Review.
  if (
    inlineFromGemini.some(
      (comment) =>
        containsBlockingSeverity(comment.body, "gemini") ||
        extractGeminiSeverities(comment.body).length === 0,
    )
  ) {
    return "fail";
  }

  return "pass";
}

export function latestGeminiNativeReviewResult(
  reviews = [],
  reviewComments = [],
  headSha,
  config = {},
) {
  return (
    reviews
      .map((review) => ({
        review,
        result: classifyGeminiNativeReview(
          review,
          reviewComments,
          headSha,
          config,
        ),
      }))
      .filter((entry) => entry.result !== null)
      .sort(
        (left, right) =>
          Date.parse(right.review.submitted_at || "") -
          Date.parse(left.review.submitted_at || ""),
      )[0]?.result || null
  );
}

export function isAcceptableNativeReview(review, agent, headSha, config = {}) {
  if (!review) return false;
  if (review.commit_id && headSha && review.commit_id !== headSha) return false;
  const login = normalizeLogin(review.user?.login);
  const body = review.body || "";

  if (agent === "codex") {
    return (
      isTrustedReviewLogin(login, agent, config) &&
      review.state === "APPROVED" &&
      !containsBlockingSeverity(body, agent)
    );
  }

  if (agent === "gemini") {
    return (
      isTrustedReviewLogin(login, agent, config) &&
      ["APPROVED", "COMMENTED"].includes(review.state) &&
      !containsBlockingSeverity(body, agent)
    );
  }

  return false;
}

export function isAcceptableClaudeComment(comment, headSha, config = {}) {
  const body = comment?.body || "";
  const login = normalizeLogin(comment?.user?.login);
  if (!isTrustedReviewLogin(login, "claude", config)) return false;
  if (extractMarkerSha(body) !== headSha) return false;
  return extractClaudeOutcome(body) === "pass";
}
