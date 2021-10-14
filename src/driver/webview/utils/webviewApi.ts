import { Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { container } from 'tsyringe';
import { createVNode } from 'vue';
import { UI, uiToken } from 'domain/service/AppService';

const MODAL_CLASS_NAME = 'keep-format-modal';
const styleEl = document.createElement('style');

styleEl.innerHTML = `.${MODAL_CLASS_NAME} {word-break: break-all; white-space: pre-line; }`;
document.head.appendChild(styleEl);

export const openModal: UI['openModal'] = ({ type, okType, okDanger, keepFormat, ...options }) => {
  return Modal[type]({
    closable: false,
    ...(type === 'confirm' ? { icon: () => createVNode(ExclamationCircleOutlined) } : null),
    ...options,
    okButtonProps: { type: okType, danger: okDanger },
    class: keepFormat ? MODAL_CLASS_NAME : '',
  });
};

export const resizeWindow: UI['resizeWindow'] = (width, height) => {
  const rootEl = getRootEl();

  rootEl.style.width = `${width}px`;
  rootEl.style.height = `${height}px`;
};

export const getRootEl: UI['getRootEl'] = () => {
  return document.querySelector('#joplin-plugin-content') as HTMLElement;
};

container.registerInstance(uiToken, { openModal, resizeWindow, getRootEl });
