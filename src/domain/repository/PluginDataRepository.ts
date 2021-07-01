import { container, InjectionToken } from 'tsyringe';
import { Article } from '../model/Article';

export interface PluginDataDb {
  fetch: <T>(path: string[]) => Promise<T>;
}

export const token: InjectionToken<PluginDataDb> = Symbol();
export class PluginDataRepository {
  private static pluginDataFetcher = container.resolve(token);

  static getCurrentTheme() {
    return this.pluginDataFetcher.fetch<string>(['theme']);
  }
  static getFieldVarsOfTheme(theme: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.pluginDataFetcher.fetch<Record<string, any>>(['fieldVars', theme]);
  }

  static getArticles() {
    return this.pluginDataFetcher.fetch<Article[]>(['articles']);
  }
}
