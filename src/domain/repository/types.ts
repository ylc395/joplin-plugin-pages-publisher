import type { Article } from '../model/Site';
import type { PageFields } from '../model/Page';

export type ArticlesSaveRequest = {
  event: 'saveArticles';
  data: Article[];
};

export type PageSaveRequest = {
  event: 'savePage';
  data: {
    theme: string;
    page: string;
    fields: PageFields;
  };
};

export interface GetPageConfigRequest {
  event: 'getPageConfig';
  theme: string;
  page: string;
}

export interface GetPageCustomFieldsRequest {
  event: 'getPageCustomFields';
  theme: string;
  page: string;
}

export interface DataFetcher {
  fetchJoplinData: <T>(
    path: string[],
    query: Record<string, unknown>,
  ) => Promise<T>;
  fetchAllJoplinData: <T>(
    path: string,
    query: Record<string, unknown>,
  ) => Promise<T[]>;
  fetchThemeConfig: (theme: string) => Promise<>;
  fetchArticles: () => Promise<Article[]>;
  fetchPageCustomFields: (theme: string, ) => 
}
