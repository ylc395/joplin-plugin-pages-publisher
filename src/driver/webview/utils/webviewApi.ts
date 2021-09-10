import { token } from '../../../domain/service/AppService';
import { container } from 'tsyringe';
import { Modal } from 'ant-design-vue';
import { constant } from 'lodash';

export interface AppRequest {
  event: 'quitApp' | 'generateSite' | 'openNote' | 'getOutputDir' | 'getGitRepositoryDir';
  payload?: any;
}

declare const webviewApi: {
  postMessage: <T = void>(payload: AppRequest) => Promise<T>;
};

container.registerInstance(token, {
  openModal(type, { title, content }) {
    // hack: when https://github.com/vueComponent/ant-design-vue/pull/4632 is merged, `constant` is no need
    return Modal[type]({
      title: constant(title),
      content: content ? constant(content) : undefined,
    });
  },

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
