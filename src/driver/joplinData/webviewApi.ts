import { container } from 'tsyringe';
import {
  token as JoplinFetcherToken,
  JoplinGetParams,
} from '../../domain/repository/JoplinDataRepository';

export interface JoplinDataRequest {
  event: 'getJoplinData' | 'getJoplinDataAll';
  args: JoplinGetParams;
}

declare const webviewApi: {
  postMessage: <T>(payload: JoplinDataRequest) => Promise<T>;
};

function fetchData<T>(...args: JoplinGetParams) {
  return webviewApi
    .postMessage<T>({
      event: 'getJoplinData',
      args,
    })
    .catch(() => null);
}

async function fetchAllData<T>(...args: JoplinGetParams) {
  return webviewApi
    .postMessage<T[]>({
      event: 'getJoplinDataAll',
      args,
    })
    .catch(() => [] as T[]);
}

container.registerInstance(JoplinFetcherToken, { fetchData, fetchAllData });
