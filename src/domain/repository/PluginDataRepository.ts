import { omit } from 'lodash';
import { container, InjectionToken } from 'tsyringe';
import type { Article } from '../model/Article';
import type { Vars } from '../model/Page';
import type { Site, Theme } from '../model/Site';
import type { PagesFieldVars } from '../service/PageService';

export interface PluginDataDb {
  fetch: <T>(path: string[]) => Promise<T | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  save: (path: string[], value: any) => Promise<void>;
}

export interface ThemeFetcher {
  fetch: (themeName: string) => Promise<Theme | null>;
}

export const pluginDataDbToken: InjectionToken<PluginDataDb> = Symbol();
export const themeFetcherToken: InjectionToken<ThemeFetcher> = Symbol();
export class PluginDataRepository {
  private static pluginDataFetcher = container.resolve(pluginDataDbToken);
  private static themeFetcher = container.resolve(themeFetcherToken);

  static getFieldVarsOfTheme(theme: string) {
    return this.pluginDataFetcher.fetch<PagesFieldVars>(['pagesFieldVars', theme]);
  }

  static saveFieldVars(theme: string, pageId: string, vars: Vars) {
    return this.pluginDataFetcher.save(['pagesFieldVars', theme, pageId], vars);
  }

  static getArticles() {
    return this.pluginDataFetcher.fetch<Article[]>(['articles']);
  }

  static saveArticles(articles: Article[]) {
    return this.pluginDataFetcher.save(['articles'], articles);
  }

  static getSite() {
    return this.pluginDataFetcher.fetch<Site>(['site']);
  }

  static saveSite(site: Site) {
    return this.pluginDataFetcher.save(['site'], omit(site, ['themeConfig', 'articles', 'tags']));
  }

  static async getTheme(themeName: string) {
    const theme = await this.themeFetcher.fetch(themeName);

    if (!theme) {
      throw new Error(`fail to load theme: ${themeName}`);
    }

    return theme;
  }
}
