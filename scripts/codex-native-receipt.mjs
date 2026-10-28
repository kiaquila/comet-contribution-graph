import { isKnownCodexHelpFooter } from "./codex-review-help.mjs";

// Presentation is a closed observed catalog, never an arbitrary prose suffix.
const closings = new Set(
  [
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
  ].map((text) => text.toLowerCase()),
);
const marker = "<!-- codex-review-receipt:v1 -->";

export function isStrictNativeCodexReceipt(
  body,
  headSha,
  { allowUnboundLegacy = false } = {},
) {
  if (!/^[a-f0-9]{40}$/.test(headSha || "")) return false;
  let text = String(body || "").trim();
  const receipt = text.startsWith(marker);
  if ((text.match(/codex-review-receipt/g) || []).length !== (receipt ? 1 : 0))
    return false;
  if (receipt) text = text.slice(marker.length).trim();
  text = text
    .replace(
      /\n\s*\[View task →\]\(https:\/\/chatgpt\.com\/s\/cd_[a-f0-9]{32}\)\s*$/,
      "",
    )
    .trim();
  const footer = text.indexOf("<details>");
  if (footer >= 0) {
    if (!isKnownCodexHelpFooter(text.slice(footer))) return false;
    text = text.slice(0, footer).trim();
  }
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const verdict = (lines[0] || "").match(
    /^Codex Review: did(?:\s+not|\s*n['’]?t)\s+find\s+any\s+major\s+issues(?: for ([a-f0-9]{10,40}))?\.(.*)$/i,
  );
  if (!verdict || !closings.has(verdict[2].trim().toLowerCase())) return false;
  const sha = lines[1]?.match(/^\*\*Reviewed commit:\*\* `([a-f0-9]{10,40})`$/);
  if (lines.length > (sha ? 2 : 1)) return false;
  if (verdict[1] && !headSha.startsWith(verdict[1])) return false;
  if (receipt && !sha) return false;
  return sha
    ? headSha.startsWith(sha[1])
    : Boolean(verdict[1]) || allowUnboundLegacy;
}
