import { DEFAULT_THEME_NAME } from './Theme';

export interface Site {
  themeName: string;
  feedEnabled: boolean;
  feedLength: number;
  generatedAt?: number;
  icon?: Uint8Array | null;
  custom: Record<string, Record<string, unknown> | undefined>;
}

export const DEFAULT_SITE: Readonly<Site> = {
  themeName: DEFAULT_THEME_NAME,
  feedEnabled: true,
  feedLength: 10,
  custom: {},
};
