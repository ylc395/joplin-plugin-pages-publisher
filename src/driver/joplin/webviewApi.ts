import { container } from 'tsyringe';
import { joplinToken } from 'domain/service/AppService';
export interface JoplinAction {
  event: 'quitApp' | 'openNote' | 'installationDir' | 'dataDir';
  payload?: any;
}

declare const webviewApi: {
  postMessage: <T = void>(payload: JoplinAction) => Promise<T>;
};

const joplin = {
  quitApp() {
    return webviewApi.postMessage({ event: 'quitApp' }) as never;
  },

  installationDir() {
    return webviewApi.postMessage<string>({ event: 'installationDir' });
  },

  dataDir() {
    return webviewApi.postMessage<string>({ event: 'dataDir' });
  },

  openNote(noteId: string) {
    return webviewApi.postMessage({ event: 'openNote', payload: noteId });
  },
} as const;

container.registerInstance(joplinToken, joplin);

export default joplin;
