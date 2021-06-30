import type joplin from 'api';
import type { Article } from '../../domain/model/Site';
import type { PageFieldValues } from '../../domain/model/Page';

export type DbArticlesDataWritePayload = {
  dataType: 'articles';
  data: Article[];
};

export type DbPagesDataWritePayload = {
  dataType: 'pages';
  data: {
    theme: string;
    page: string;
    values: PageFieldValues;
  };
};

export interface JoplinResponse<T> {
  items: T[];
  has_more: boolean;
}
export interface JoplinDataRequest {
  event: 'getJoplinData';
  args: Parameters<typeof joplin['data']['get']>;
}

export type DbDataRequest =
  | {
      event: 'getDbData';
      path: string;
    }
  | {
      event: 'saveDbData';
      payload: DbArticlesDataWritePayload | DbPagesDataWritePayload;
    };

export interface PageConfigRequest {
  event: 'getPageConfig';
  theme: string;
  page: string;
}
