import { Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { container } from 'tsyringe';
import { createVNode } from 'vue';
import { Modal as AppModal, openModalToken } from 'domain/service/AppService';

export const openModal = ({ type, ...options }: AppModal) => {
  return Modal[type]({
    closable: false,
    ...(type === 'confirm' ? { icon: () => createVNode(ExclamationCircleOutlined) } : null),
    ...options,
  });
};

container.registerInstance(openModalToken, openModal);
