import { Field, INDEX_PAGE_NAME, ARTICLE_PAGE_NAME } from './Page';

type PageName = string;

export const DEFAULT_THEME_NAME = 'Default';

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
    [INDEX_PAGE_NAME]: [{ name: 'slogan' }],
    [ARTICLE_PAGE_NAME]: [],
    archives: [],
    about: [{ name: 'content', inputType: 'textarea', rules: [{ required: true }] }],
  },
};
