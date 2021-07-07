import type { Article } from './Article';
import type { Tag } from './JoplinData';
import { Field, FIELD_SCHEMA, HomePage } from './Page';

interface MenuItem {
  label: string;
  link: string;
}

interface MenuItemGroup {
  label: string;
  items: MenuItem;
}

type PageName = string;
export interface Theme {
  readonly name: string; // no need in config.js
  readonly author?: string;
  readonly version: string;
  readonly pages: Readonly<Record<PageName, Field[] | undefined>>;
}

export const DEFAULT_THEME = 'default';

export const defaultTheme: Theme = {
  name: DEFAULT_THEME,
  author: 'ylc395',
  version: '0.0.1',
  pages: {
    [HomePage.pageName]: [{ name: 'slogan' }],
  },
};

type Menu = Array<MenuItem | MenuItemGroup>;

export interface Site {
  name: string;
  themeName: string;
  themeConfig?: Theme | null;
  description: string;
  language: string;
  icon: ArrayBuffer | null;
  RSSMode: 'full' | 'abstract';
  RSSLength: number;
  menu: Menu;
  articlePagePrefix: string;
  archivesPagePrefix: string;
  tagPagePrefix: string;
  footer: string;
  generatedAt: number | null;
  tags?: Array<Tag['title']>;
  articles?: Article[];
}

export const defaultSite: Site = {
  name: '',
  description: '',
  themeName: DEFAULT_THEME,
  themeConfig: null,
  language: '',
  icon: null,
  RSSMode: 'full',
  RSSLength: 10,
  menu: [],
  articlePagePrefix: 'article',
  archivesPagePrefix: 'archives',
  tagPagePrefix: 'tag',
  footer: '',
  generatedAt: null,
  articles: [],
  tags: [],
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
