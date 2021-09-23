import { container } from 'tsyringe';
import { joplinToken } from 'domain/service/AppService';
export interface JoplinAction {
  event: 'quitApp' | 'openNote' | 'installationDir';
  payload?: any;
}

declare const webviewApi: {
  postMessage: <T = void>(payload: JoplinAction) => Promise<T>;
};

container.registerInstance(joplinToken, {
  quitApp() {
    return webviewApi.postMessage({ event: 'quitApp' });
  },

  installationDir() {
    return webviewApi.postMessage({ event: 'installationDir' });
  },

  openNote(noteId: string) {
    return webviewApi.postMessage({ event: 'openNote', payload: noteId });
  },
});
