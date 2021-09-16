import { Modal } from 'ant-design-vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { container } from 'tsyringe';
import { constant } from 'lodash';
import { createVNode } from 'vue';
import { Modal as AppModal, openModalToken } from '../../../domain/service/AppService';

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

container.registerInstance(openModalToken, openModal);
