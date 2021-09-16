import { container } from 'tsyringe';
import { joplinToken } from '../../domain/service/AppService';
export interface JoplinAction {
  event: 'quitApp' | 'openNote';
  payload?: any;
}

declare const webviewApi: {
  postMessage: <T = void>(payload: JoplinAction) => Promise<T>;
};

container.registerInstance(joplinToken, {
  quitApp() {
    return webviewApi.postMessage({ event: 'quitApp' });
  },

  openNote(noteId: string) {
    return webviewApi.postMessage({ event: 'openNote', payload: noteId });
  },
});
