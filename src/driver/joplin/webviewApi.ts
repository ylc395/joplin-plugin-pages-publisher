import { container } from 'tsyringe';
import { joplinToken, JoplinGetParams } from 'domain/service/AppService';

interface JoplinAction {
  event:
    | 'quit'
    | 'openNote'
    | 'getInstallationDir'
    | 'getDataDir'
    | 'getWindowSize'
    | 'isNewUser'
    | 'setAsOldUser';
  payload?: any;
}

interface JoplinDataRequest {
  event: 'getJoplinData' | 'getJoplinDataAll';
  args: JoplinGetParams;
}

interface JoplinPluginSettingRequest {
  event: 'getJoplinPluginSetting';
  key: string;
}

export type JoplinRequest = JoplinAction | JoplinDataRequest | JoplinPluginSettingRequest;

declare const webviewApi: {
  postMessage: <T = void>(payload: JoplinRequest) => Promise<T>;
};

const joplin = {
  fetchData<T>(...args: JoplinGetParams) {
    return webviewApi
      .postMessage<T>({
        event: 'getJoplinData',
        args,
      })
      .catch(() => null);
  },

  fetchAllData<T>(...args: JoplinGetParams) {
    return webviewApi
      .postMessage<T[]>({
        event: 'getJoplinDataAll',
        args,
      })
      .catch(() => [] as T[]);
  },

  async fetchPluginSetting<T>(key: string) {
    try {
      return await webviewApi.postMessage<T>({
        event: 'getJoplinPluginSetting',
        key,
      });
    } catch {
      return null;
    }
  },

  quit() {
    return webviewApi.postMessage({ event: 'quit' }) as never;
  },

  getInstallationDir() {
    return webviewApi.postMessage<string>({ event: 'getInstallationDir' });
  },

  getDataDir() {
    return webviewApi.postMessage<string>({ event: 'getDataDir' });
  },

  openNote(noteId: string) {
    return webviewApi.postMessage({ event: 'openNote', payload: noteId });
  },

  getWindowSize() {
    return webviewApi.postMessage<[number, number]>({ event: 'getWindowSize' });
  },

  isNewUser() {
    return webviewApi.postMessage<boolean>({ event: 'isNewUser' });
  },

  setAsOldUser() {
    return webviewApi.postMessage<void>({ event: 'setAsOldUser' });
  },
} as const;

container.registerInstance(joplinToken, joplin);

export default joplin;
