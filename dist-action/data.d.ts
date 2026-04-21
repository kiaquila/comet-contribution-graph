import type { ContributionDay, FetchOptions } from "./types.js";
export declare function fetchContributions(username: string, token: string, opts?: FetchOptions): Promise<ContributionDay[]>;
export declare function parseContributionsResponse(payload: unknown): ContributionDay[];
