import { Article } from './Article';
import { Tag } from './JoplinData';

interface MenuItem {
  label: string;
  link: string;
}

interface MenuItemGroup {
  label: string;
  items: MenuItem;
}

type Menu = Array<MenuItem | MenuItemGroup>;

export interface Site {
  theme: string;
  name: string;
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
