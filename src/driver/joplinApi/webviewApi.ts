import { token } from '../../domain/service/AppService';
import { container } from 'tsyringe';

export interface AppRequest {
  event: 'quitApp' | 'generateSite' | 'openNote' | 'getOutputDir' | 'getGitRepositoryDir';
  payload?: any;
}

declare const webviewApi: {
  postMessage: <T = void>(payload: AppRequest) => Promise<T>;
};

container.registerInstance(token, {
  quit() {
    return webviewApi.postMessage({ event: 'quitApp' });
  },

  generateSite() {
    return webviewApi.postMessage<string[]>({ event: 'generateSite' });
  },

  openNote(noteId: string) {
    return webviewApi.postMessage({ event: 'openNote', payload: noteId });
  },

  getOutputDir() {
    return webviewApi.postMessage<string>({ event: 'getOutputDir' });
  },

  getGitRepositoryDir() {
    return webviewApi.postMessage<string>({ event: 'getGitRepositoryDir' });
  },
});
