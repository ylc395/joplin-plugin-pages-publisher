import { Ref } from 'vue';
import type { InjectionToken } from 'tsyringe';
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

export const token: InjectionToken<Site> = Symbol();

export interface Site {
  theme: {
    name: string;
    version: string;
  };
  name: string;
  description: string;
  language: string;
  icon: ArrayBuffer;
  RSSMode: 'full' | 'abstract';
  RSSLength: number;
  menu: Menu;
  tags: Tag[];
  articles: Article[];
  articlePagePrefix: Ref<string>;
  archivesPagePrefix: Ref<string>;
  tagPagePrefix: Ref<string>;
  footer: string;
  generatedAt: Date;
}
