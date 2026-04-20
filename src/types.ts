export type ISODate = string;

export interface ContributionDay {
  date: ISODate;
  count: number;
}

export type ThemeName = "dark" | "light";

export interface Theme {
  name: ThemeName;
  background: string;
  starFill: string;
  peakFill: string;
  cometHead: string;
  cometTrail: string;
  label: string;
}

export interface RenderOptions {
  theme: Theme;
  animated: boolean;
  seed?: number;
}
