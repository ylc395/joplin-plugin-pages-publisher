import Ajv from 'ajv';
import { omit } from 'lodash';
import { container, InjectionToken } from 'tsyringe';
import { toRaw } from 'vue';
import type { Article } from '../model/Article';
import type { Vars } from '../model/Page';
import { Site } from '../model/Site';
import { defaultTheme, Theme, THEME_SCHEMA } from '../model/Theme';
import type { PagesFieldVars } from '../service/PageService';

const validator = new Ajv();
const themeValidate = validator.compile(THEME_SCHEMA);

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
  private readonly pluginDataFetcher = container.resolve(pluginDataDbToken);
  private readonly themeFetcher = container.resolve(themeFetcherToken);

  getFieldVarsOfTheme(themeName: string) {
    return this.pluginDataFetcher.fetch<PagesFieldVars>(['pagesFieldVars', themeName]);
  }

  saveFieldVars(themeName: string, pageName: string, vars: Vars) {
    return this.pluginDataFetcher.save(['pagesFieldVars', themeName, pageName], toRaw(vars));
  }

  getArticles() {
    return this.pluginDataFetcher.fetch<Article[]>(['articles']);
  }

  saveArticles(articles: Article[]) {
    return this.pluginDataFetcher.save(
      ['articles'],
      toRaw(articles).map((article) => omit(article, ['images', 'attachments', 'sourceStatus'])),
    );
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

    if (!theme || !themeValidate(theme)) {
      const msg = themeValidate.errors
        ? themeValidate.errors.map(({ message }) => message).join('\n')
        : '';
      console.warn(`fail to load theme: ${themeName}. ${msg}`);
      return null;
    }

    return theme;
  }

  async getThemes() {
    const themes = await this.themeFetcher.fetchAll();

    return [defaultTheme, ...themes.filter((theme) => themeValidate(theme))];
  }
}
