import { container } from 'tsyringe';
import { pluginDataDbToken, PluginDataDb } from 'domain/repository/PluginDataRepository';

export interface DbReadRequest {
  event: 'dbFetch';
  args: Parameters<PluginDataDb['fetch']>;
}

export interface DbWriteRequest {
  event: 'dbSave';
  args: Parameters<PluginDataDb['save']>;
}

declare const webviewApi: {
  postMessage: <T>(payload: DbReadRequest | DbWriteRequest) => Promise<T>;
};

container.registerInstance(pluginDataDbToken, {
  fetch<T>(path: string[]) {
    return webviewApi.postMessage<T>({ event: 'dbFetch', args: [path] });
  },
  save(path: string[], value: unknown) {
    return webviewApi.postMessage<void>({ event: 'dbSave', args: [path, value] });
  },
});
