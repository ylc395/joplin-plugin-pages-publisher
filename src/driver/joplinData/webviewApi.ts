import { container } from 'tsyringe';
import {
  token as JoplinFetcherToken,
  JoplinGetParams,
} from '../../domain/repository/JoplinDataRepository';

export interface JoplinDataRequest {
  event: 'getJoplinData' | 'getJoplinDataAll';
  args: JoplinGetParams;
}

export interface JoplinPluginSettingRequest {
  event: 'getJoplinPluginSetting';
  key: string;
}

declare const webviewApi: {
  postMessage: <T>(payload: JoplinDataRequest | JoplinPluginSettingRequest) => Promise<T>;
};

function fetchData<T>(...args: JoplinGetParams) {
  return webviewApi
    .postMessage<T>({
      event: 'getJoplinData',
      args,
    })
    .catch(() => null);
}

function fetchAllData<T>(...args: JoplinGetParams) {
  return webviewApi
    .postMessage<T[]>({
      event: 'getJoplinDataAll',
      args,
    })
    .catch(() => [] as T[]);
}

async function fetchPluginSetting<T>(key: string) {
  try {
    return await webviewApi.postMessage<T>({
      event: 'getJoplinPluginSetting',
      key,
    });
  } catch {
    return null;
  }
}

container.registerInstance(JoplinFetcherToken, { fetchData, fetchAllData, fetchPluginSetting });
