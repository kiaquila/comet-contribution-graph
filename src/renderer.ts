import type { ContributionDay, RenderOptions } from "./types.js";

export function renderCometSVG(
  _days: ContributionDay[],
  _options: RenderOptions,
): string {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="112"></svg>';
}
