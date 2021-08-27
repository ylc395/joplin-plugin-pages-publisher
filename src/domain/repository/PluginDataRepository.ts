import { omit } from 'lodash';
import { container, InjectionToken } from 'tsyringe';
import { toRaw } from 'vue';
import type { Article } from '../model/Article';
import type { Vars } from '../model/Page';
import { Site } from '../model/Site';
import { defaultTheme, Theme } from '../model/Theme';
import type { PagesFieldVars } from '../service/PageService';

export interface PluginDataDb {
  fetch: <T>(path: string[]) => Promise<T | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  save: (path: string[], value: any) => Promise<void>;
}

export interface ThemeLoader {
  fetch: (themeName: string) => Promise<Theme | string>;
  fetchAll: () => Promise<Theme[]>;
}

export const pluginDataDbToken: InjectionToken<PluginDataDb> = Symbol('pluginDataDb');
export const themeLoaderToken: InjectionToken<ThemeLoader> = Symbol('themeFetcher');

export class PluginDataRepository {
  private readonly pluginDataLoader = container.resolve(pluginDataDbToken);
  private readonly themeLoader = container.resolve(themeLoaderToken);

  getFieldVarsOfTheme(themeName: string) {
    return this.pluginDataLoader.fetch<PagesFieldVars>(['pagesFieldVars', themeName]);
  }

  saveFieldVars(themeName: string, pageName: string, vars: Vars) {
    return this.pluginDataLoader.save(['pagesFieldVars', themeName, pageName], toRaw(vars));
  }

  getArticles() {
    return this.pluginDataLoader.fetch<Article[]>(['articles']);
  }

  saveArticles(articles: Article[]) {
    return this.pluginDataLoader.save(
      ['articles'],
      toRaw(articles).map((article) => omit(article, ['images', 'attachments', 'noteContent'])),
    );
  }

  getSite() {
    return this.pluginDataLoader.fetch<Site>(['site']);
  }

  saveSite(site: Site) {
    return this.pluginDataLoader.save(
      ['site'],
      omit(toRaw(site), ['themeConfig', 'articles', 'tags']),
    );
  }

  async getTheme(themeName: string) {
    if (themeName === defaultTheme.name) {
      return defaultTheme;
    }

    const theme = await this.themeLoader.fetch(themeName);

    if (typeof theme === 'string') {
      throw Error(`Fail to load theme: ${themeName}.\nReason: ${theme}`);
    }

    return theme;
  }

  async getThemes() {
    const themes = await this.themeLoader.fetchAll();

    return [defaultTheme, ...themes];
  }
}
