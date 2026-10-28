const help = `[Your team has set up Codex to review pull requests in this repo](https://chatgpt.com/codex/cloud/settings/general). Reviews are triggered when you
- Open a pull request for review
- Mark a draft as ready
- Comment "@codex review".

If Codex has suggestions, it will comment; otherwise it will react with 👍.`;
const questions = `Codex can also answer questions or update the PR. Try commenting "@codex address that feedback".`;
const normalize = (text) => text.replace(/\s+/g, " ").trim();
const knownBodies = new Set([
  normalize(help),
  normalize(`${help} ${questions}`),
]);

export const isKnownCodexHelpFooter = (footer) => {
  const match = footer.match(
    /^<details>\s*<summary>(?:[ℹ💡]\ufe0f?\s*)?About Codex in GitHub<\/summary>\s*(?:<br\s*\/>)?\s*([\s\S]*?)\s*<\/details>$/,
  );
  return Boolean(match && knownBodies.has(normalize(match[1])));
};
