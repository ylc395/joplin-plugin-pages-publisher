import type { DbData } from '../db';
import {
  JoplinDataRequest,
  DbDataRequest,
  PageConfigRequest,
  JoplinResponse,
  DbArticlesDataWritePayload,
  DbPagesDataWritePayload,
} from './types';

export * from './types';

declare const webviewApi: {
  postMessage: <T>(
    payload: JoplinDataRequest | DbDataRequest | PageConfigRequest,
  ) => Promise<T>;
};

export function fetchData<K = unknown, T = true>(
  ...args: JoplinDataRequest['args']
) {
  return webviewApi.postMessage<T extends true ? JoplinResponse<K> : T>({
    event: 'getJoplinData',
    args,
  });
}

export async function fetchAllData<T = unknown>(path: string[], params = {}) {
  let result: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { items, has_more } = await fetchData<T, true>(path, {
      page: page++,
      ...params,
    });

    result = result.concat(items);
    hasMore = has_more;
  }

  return result;
}

export function getDataFromDb(path: string) {
  return webviewApi.postMessage<DbData>({ event: 'getDbData', path });
}

export function saveDbToData(
  payload: DbArticlesDataWritePayload | DbPagesDataWritePayload,
) {
  return webviewApi.postMessage<void>({ event: 'saveDbData', payload });
}

export async function getPageConfig(theme: string, page: string) {
  return webviewApi.postMessage<string>({
    event: 'getPageConfig',
    theme,
    page,
  });
}
