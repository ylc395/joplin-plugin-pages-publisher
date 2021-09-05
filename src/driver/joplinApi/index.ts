import joplin from 'api';
import { JoplinGetParams } from '../../domain/repository/JoplinDataRepository';

interface JoplinResponse<T> {
  items: T[];
  has_more: boolean;
}

export function fetchData<T>(...args: JoplinGetParams) {
  return joplin.data.get(...args) as Promise<T>;
}

export async function fetchAllData<T>(...[path, query]: JoplinGetParams) {
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
