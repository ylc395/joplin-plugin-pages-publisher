import { Modal } from 'ant-design-vue';
import { constant } from 'lodash';
import type { Modal as AppModal } from '../../../domain/service/AppService';

export interface AppRequest {
  event: 'quitApp' | 'openNote' | 'getOutputDir' | 'getGitRepositoryDir';
  payload?: any;
}

declare const webviewApi: {
  postMessage: <T = void>(payload: AppRequest) => Promise<T>;
};

export const openModal = ({ type, title, content }: AppModal) => {
  // hack: when https://github.com/vueComponent/ant-design-vue/pull/4632 is merged, `constant` is no need
  return Modal[type]({
    title: title ? constant(title) : undefined,
    content: content ? constant(content) : undefined,
  });
};

export function quit() {
  return webviewApi.postMessage({ event: 'quitApp' });
}

export function openNote(noteId: string) {
  return webviewApi.postMessage({ event: 'openNote', payload: noteId });
}

export function getOutputDir() {
  return webviewApi.postMessage<string>({ event: 'getOutputDir' });
}

export function getGitRepositoryDir() {
  return webviewApi.postMessage<string>({ event: 'getGitRepositoryDir' });
}
