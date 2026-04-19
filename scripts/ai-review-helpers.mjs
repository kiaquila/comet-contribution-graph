const reviewerBotLogins = new Set([
  "chatgpt-codex-connector[bot]",
  "gemini-code-assist[bot]",
  "claude[bot]",
]);

export const codexReviewerLogins = new Set(["chatgpt-codex-connector[bot]"]);

const codexSummaryPrefix = /^Codex Review:/i;
const codexNoIssuesPattern =
  /did(?:\s+not|\s*n['']?t)\s+find\s+any\s+major\s+issues/i;
const codexEnvironmentPattern = /create an environment for this repo/i;
const codexAccountPattern = /create a codex account and connect to github/i;
const codexTriggerPattern = /@codex review\b/i;

const getBody = (entry) => (entry?.body || "").trim();
const getLogin = (entry) => entry?.user?.login || "";

const isCommentEvent = (entry) => !entry?.event || entry.event === "commented";

const isCodexBotComment = (entry) =>
  isCommentEvent(entry) && codexReviewerLogins.has(getLogin(entry));

const isHumanCodexTriggerComment = (entry) =>
  isCommentEvent(entry) &&
  codexTriggerPattern.test(getBody(entry)) &&
  !reviewerBotLogins.has(getLogin(entry));

const isCurrentHeadActivationEvent = (entry, headSha) =>
  (entry?.event === "committed" && entry?.sha === headSha) ||
  ((entry?.event === "head_ref_force_pushed" ||
    entry?.event === "head_ref_restored") &&
    entry?.commit_id === headSha);

export const matchesCodexReview = (review, headSha) =>
  review?.commit_id === headSha &&
  codexReviewerLogins.has(review?.user?.login || "") &&
  (review?.body || "").includes("Codex Review");

export const matchesCodexSummaryComment = (comment) =>
  isCodexBotComment(comment) && codexSummaryPrefix.test(getBody(comment));

export const classifyCodexSetupReply = (comment) => {
  const body = getBody(comment);

  if (codexEnvironmentPattern.test(body)) {
    return {
      outcome: "fail",
      reason:
        "Codex could not start the selected review because no Codex cloud environment is configured for this repository.",
      details: [comment.html_url],
    };
  }

  if (codexAccountPattern.test(body)) {
    return {
      outcome: "fail",
      reason:
        "Codex could not start the selected review because the trigger did not come from a connected human Codex account.",
      details: [comment.html_url],
    };
  }

  return null;
};

export const classifyCodexSummaryComment = (comment) => {
  const body = getBody(comment);

  if (codexNoIssuesPattern.test(body)) {
    return {
      outcome: "pass",
      reason: "Codex completed review with no major issues.",
      details: [comment.html_url],
    };
  }

  return {
    outcome: "pending",
    reason:
      "Codex summary comment did not match a recognized no-findings reply.",
    details: [comment.html_url],
  };
};

export const findLatestHeadActivationIndex = (timelineEvents, headSha) => {
  if (!Array.isArray(timelineEvents) || !headSha) {
    return -1;
  }

  for (let index = timelineEvents.length - 1; index >= 0; index -= 1) {
    if (isCurrentHeadActivationEvent(timelineEvents[index], headSha)) {
      return index;
    }
  }

  return -1;
};

export const pickAuthoritativeCodexSkipModeComment = ({
  timelineEvents,
  headSha,
}) => {
  if (
    !Array.isArray(timelineEvents) ||
    timelineEvents.length === 0 ||
    !headSha
  ) {
    return null;
  }

  const activationIndex = findLatestHeadActivationIndex(
    timelineEvents,
    headSha,
  );
  if (activationIndex < 0) {
    return null;
  }

  let boundaryIndex = activationIndex;
  for (
    let index = activationIndex + 1;
    index < timelineEvents.length;
    index += 1
  ) {
    if (isHumanCodexTriggerComment(timelineEvents[index])) {
      boundaryIndex = index;
    }
  }

  const latestCodexComment =
    timelineEvents
      .slice(boundaryIndex + 1)
      .filter((entry) => isCodexBotComment(entry))
      .at(-1) || null;

  if (!latestCodexComment) {
    return null;
  }

  const setupClassification = classifyCodexSetupReply(latestCodexComment);
  if (setupClassification) {
    return {
      comment: latestCodexComment,
      classification: setupClassification,
      reviewState: "SETUP_REQUIRED",
      boundaryType:
        boundaryIndex === activationIndex ? "head-activation" : "human-trigger",
    };
  }

  if (!matchesCodexSummaryComment(latestCodexComment)) {
    return null;
  }

  const summaryClassification = classifyCodexSummaryComment(latestCodexComment);
  if (summaryClassification.outcome === "pending") {
    return null;
  }

  return {
    comment: latestCodexComment,
    classification: summaryClassification,
    reviewState: "COMMENTED_NO_FINDINGS",
    boundaryType:
      boundaryIndex === activationIndex ? "head-activation" : "human-trigger",
  };
};
