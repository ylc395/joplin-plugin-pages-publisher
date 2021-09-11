import { omit } from 'lodash';
import { container, InjectionToken } from 'tsyringe';
import type { Article } from '../model/Article';
import type { Vars } from '../model/Page';
import { Site } from '../model/Site';
import type { Theme } from '../model/Theme';
import type { PagesFieldVars } from '../service/PageService';

export interface PluginDataDb {
  fetch: <T>(path: string[]) => Promise<T | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  save: (path: string[], value: any) => Promise<void>;
}

export interface ThemeLoader {
  fetch: (themeName: string) => Promise<Theme>;
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
    return this.pluginDataLoader.save(['pagesFieldVars', themeName, pageName], vars);
  }

  getArticles() {
    return this.pluginDataLoader.fetch<Article[]>(['articles']);
  }

  saveArticles(articles: Article[]) {
    const toOmit = ['images', 'attachments', 'noteContent', 'htmlContent'];

    return this.pluginDataLoader.save(
      ['articles'],
      articles.map((article) => omit(article, toOmit)),
    );
  }

  getSite() {
    return this.pluginDataLoader.fetch<Site>(['site']);
  }

  async saveSite(site: Site) {
    await this.pluginDataLoader.save(['site'], site);
  }

  async getTheme(themeName: string) {
    try {
      const theme = await this.themeLoader.fetch(themeName);
      return theme;
    } catch (error) {
      throw Error(`Fail to load theme: ${themeName}.\nReason: ${(error as Error).message}`);
    }
  }

  async getThemes() {
    const themes = await this.themeLoader.fetchAll();
    return themes;
  }
}
