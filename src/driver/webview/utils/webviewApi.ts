import { Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { constant } from 'lodash';
import { createVNode } from 'vue';
import type { Modal as AppModal } from '../../../domain/service/AppService';

export interface AppRequest {
  event: 'quitApp' | 'openNote' | 'getOutputDir' | 'getGitRepositoryDir';
  payload?: any;
}

declare const webviewApi: {
  postMessage: <T = void>(payload: AppRequest) => Promise<T>;
};

export const openModal = ({ type, content, title, ...options }: AppModal) => {
  // hack: when https://github.com/vueComponent/ant-design-vue/pull/4632 is merged, `constant` is no need
  return Modal[type]({
    title: title ? constant(title) : undefined,
    content: content ? constant(content) : undefined,
    closable: false,
    ...(type === 'confirm' ? { icon: () => createVNode(ExclamationCircleOutlined) } : null),
    ...options,
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
