export type ISODate = string;

export interface ContributionDay {
  readonly date: ISODate;
  readonly count: number;
}

export type ThemeName = "dark" | "light";

export interface Theme {
  readonly name: ThemeName;
  readonly background: string;
  readonly bgStarTints: readonly string[];
  readonly dataStarHue: number;
  readonly peakCore: string;
  readonly peakHalo: string;
  readonly cometHead: string;
  readonly constellation: string;
  readonly label: string;
}

export interface RenderOptions {
  readonly theme: Theme;
  readonly animated: boolean;
  readonly seed?: number;
}

export interface NormalizedDay extends ContributionDay {
  readonly index: number;
  readonly isActive: boolean;
  readonly aboveMedian: boolean;
  readonly isPeak: boolean;
  readonly intensity: number;
  readonly peakIntensity: number;
}

export interface Normalization {
  readonly days: readonly NormalizedDay[];
  readonly peaks: readonly NormalizedDay[];
  readonly median: number;
  readonly peakFloor: number;
}
