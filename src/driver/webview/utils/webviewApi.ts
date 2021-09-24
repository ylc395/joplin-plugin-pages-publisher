import { Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { container } from 'tsyringe';
import { createVNode } from 'vue';
import { Modal as AppModal, openModalToken, MODAL_CLASS_NAME } from 'domain/service/AppService';

const styleEl = document.createElement('style');
styleEl.innerHTML = `.${MODAL_CLASS_NAME}{word-break: break-all; white-space: pre-line; }`;
document.head.appendChild(styleEl);

export const openModal = ({ type, okType, okDanger, ...options }: AppModal) => {
  return Modal[type]({
    closable: false,
    ...(type === 'confirm' ? { icon: () => createVNode(ExclamationCircleOutlined) } : null),
    ...options,
    okButtonProps: { type: okType, danger: okDanger },
  });
};

container.registerInstance(openModalToken, openModal);
