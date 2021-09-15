import type { Article } from './Article';
import { DEFAULT_THEME_NAME } from './Theme';

export interface Site {
  themeName: string;
  feedEnabled: boolean;
  feedLength: number;
  generatedAt?: number;
  articles?: Article[]; // sorted by createdAt
  custom: Record<string, Record<string, unknown> | undefined>;
}

export const DEFAULT_SITE: Readonly<Site> = {
  themeName: DEFAULT_THEME_NAME,
  feedEnabled: true,
  feedLength: 10,
  custom: {},
};

export interface GeneratingProgress {
  totalPages: number;
  generatedPages: number;
  result?: null | 'success' | 'fail';
  reason?: string;
}
