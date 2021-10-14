import { container } from 'tsyringe';
import { joplinToken } from 'domain/service/AppService';
export interface JoplinAction {
  event: 'quit' | 'openNote' | 'getInstallationDir' | 'getDataDir' | 'getWindowSize';
  payload?: any;
}

declare const webviewApi: {
  postMessage: <T = void>(payload: JoplinAction) => Promise<T>;
};

const joplin = {
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
} as const;

container.registerInstance(joplinToken, joplin);

export default joplin;
