import { omit } from 'lodash';
import { container, InjectionToken } from 'tsyringe';
import { toRaw } from 'vue';
import type { Article } from '../model/Article';
import type { Vars } from '../model/Page';
import { defaultTheme, Site, Theme } from '../model/Site';
import type { PagesFieldVars } from '../service/PageService';

export interface PluginDataDb {
  fetch: <T>(path: string[]) => Promise<T | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  save: (path: string[], value: any) => Promise<void>;
}

export interface ThemeFetcher {
  fetch: (themeName: string) => Promise<Theme | null>;
  fetchAll: () => Promise<Theme[]>;
}

export const pluginDataDbToken: InjectionToken<PluginDataDb> = Symbol('pluginDataDb');
export const themeFetcherToken: InjectionToken<ThemeFetcher> = Symbol('themeFetcher');

export class PluginDataRepository {
  private pluginDataFetcher = container.resolve(pluginDataDbToken);
  private themeFetcher = container.resolve(themeFetcherToken);

  getFieldVarsOfTheme(theme: string) {
    return this.pluginDataFetcher.fetch<PagesFieldVars>(['pagesFieldVars', theme]);
  }

  saveFieldVars(theme: string, pageId: string, vars: Vars) {
    return this.pluginDataFetcher.save(['pagesFieldVars', theme, pageId], toRaw(vars));
  }

  getArticles() {
    // todo: add schema check
    return this.pluginDataFetcher.fetch<Article[]>(['articles']);
  }

  saveArticles(articles: Article[]) {
    return this.pluginDataFetcher.save(['articles'], toRaw(articles));
  }

  getSite() {
    return this.pluginDataFetcher.fetch<Site>(['site']);
  }

  saveSite(site: Site) {
    return this.pluginDataFetcher.save(
      ['site'],
      omit(toRaw(site), ['themeConfig', 'articles', 'tags']),
    );
  }

  async getTheme(themeName: string) {
    if (themeName === defaultTheme.name) {
      return defaultTheme;
    }

    const theme = await this.themeFetcher.fetch(themeName);

    // todo: add schema check
    if (!theme) {
      console.warn(`fail to load theme: ${themeName}.`);
      return null;
    }

    return theme;
  }
  async getThemes() {
    const themes = await this.themeFetcher.fetchAll();

    // todo: add schema check
    return [defaultTheme, ...themes];
  }
}
