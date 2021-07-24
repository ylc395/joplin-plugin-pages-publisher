import { container } from 'tsyringe';
import {
  token as JoplinFetcherToken,
  JoplinGetParams,
} from '../../domain/repository/JoplinDataRepository';

export interface JoplinDataRequest {
  event: 'getJoplinData';
  args: JoplinGetParams;
}
export interface JoplinResponse<T> {
  items: T[];
  has_more: boolean;
}

declare const webviewApi: {
  // warning: even if this method returns promise, it is still a sync method
  postMessage: <T>(payload: JoplinDataRequest) => Promise<T>;
};

function fetchData<T>(...args: JoplinGetParams) {
  return webviewApi.postMessage<T>({
    event: 'getJoplinData',
    args,
  });
}

async function fetchAllData<T>(...[path, query]: JoplinGetParams) {
  let result: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { items, has_more } = await fetchData<JoplinResponse<T>>(path, {
      ...query,
      page: page++,
    });

    result = result.concat(items);
    hasMore = has_more;
  }

  return result;
}

container.registerInstance(JoplinFetcherToken, { fetchData, fetchAllData });
