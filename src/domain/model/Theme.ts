import { Field, HomePage, ArchivesPage, ArticlePage, FIELD_SCHEMA } from './Page';

type PageName = string;

export const DEFAULT_THEME_NAME = 'default';

export interface Theme {
  readonly name: string; // no need in config.js
  readonly author?: string;
  readonly version: string;
  readonly pages: Readonly<Record<PageName, Field[] | undefined>>;
}

export const defaultTheme: Theme = {
  name: DEFAULT_THEME_NAME,
  author: 'ylc395',
  version: '0.0.1',
  pages: {
    [HomePage.pageName]: [{ name: 'slogan' }],
    [ArticlePage.pageName]: [],
    [ArchivesPage.pageName]: [],
    about: [{ name: 'content', inputType: 'textarea', required: true }],
  },
};

export const THEME_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    version: { type: 'string' },
    pages: { type: 'array', items: FIELD_SCHEMA },
  },
  required: ['name', 'version', 'pages'],
} as const;