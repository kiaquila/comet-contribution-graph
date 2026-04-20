import { expect, test } from "@playwright/test";
import { readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findHtmlFiles(full));
    } else if (entry.endsWith(".html")) {
      results.push(full);
    }
  }
  return results.sort();
}

const prototypesDir = resolve(repoRoot, "prototypes");
const htmlFiles = findHtmlFiles(prototypesDir);

for (const filePath of htmlFiles) {
  const label = relative(repoRoot, filePath);

  test(`smoke — no uncaught errors: ${label}`, async ({ page }) => {
    const uncaught = [];
    page.on("pageerror", (err) => uncaught.push(err.message));

    await page.goto(pathToFileURL(filePath).href);
    // Allow requestAnimationFrame, setTimeout, and initial render to run.
    await page.waitForTimeout(2000);

    expect(
      uncaught,
      `Uncaught JS errors in ${label}:\n${uncaught.join("\n")}`,
    ).toHaveLength(0);
  });
}
