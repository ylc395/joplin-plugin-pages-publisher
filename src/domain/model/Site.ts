import type { Article } from './Article';
import type { Tag } from './JoplinData';
import type { Field } from './Page';

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
  readonly name: string;
  readonly author: string;
  readonly version: string;
  readonly pages: Readonly<Record<PageName, Field[] | undefined>>;
}

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
  tags: Array<Tag['title']>;
  articles: Article[];
}
