import { container } from 'tsyringe';
import { pluginDataDbToken, PluginDataDb } from 'domain/repository/PluginDataRepository';

interface DbReadRequest {
  event: 'dbFetch';
  args: Parameters<PluginDataDb['fetch']>;
}

interface DbWriteRequest {
  event: 'dbSave';
  args: Parameters<PluginDataDb['save']>;
}

interface FetchIconRequest {
  event: 'fetchIcon';
}

interface SaveIconRequest {
  event: 'saveIcon';
  payload: {
    icon: Uint8Array | undefined | null;
  };
}

export type DbRequest = DbReadRequest | DbWriteRequest | FetchIconRequest | SaveIconRequest;

declare const webviewApi: {
  postMessage: <T>(payload: DbRequest) => Promise<T>;
};

container.registerInstance(pluginDataDbToken, {
  async fetch<T>(path: string[]) {
    return webviewApi.postMessage<T>({ event: 'dbFetch', args: [path] });
  },
  save(path: string[], value: unknown) {
    return webviewApi.postMessage<void>({ event: 'dbSave', args: [path, value] });
  },

  async fetchIcon() {
    return webviewApi.postMessage({ event: 'fetchIcon' });
  },

  async saveIcon(icon: Uint8Array | null | undefined) {
    return webviewApi.postMessage({ event: 'saveIcon', payload: { icon } });
  },
});
