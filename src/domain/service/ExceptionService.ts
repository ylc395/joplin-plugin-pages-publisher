import { singleton } from 'tsyringe';
import { Modal } from 'ant-design-vue';
import { constant } from 'lodash';

interface ErrorDesc {
  title?: string;
  message?: string;
}
@singleton()
export class ExceptionService {
  constructor() {
    window.addEventListener('error', (e) => this.reportError(e.error));
    window.addEventListener('unhandledrejection', (e) => this.reportError(Error(e.reason)));
  }

  reportError(err: Error, desc?: ErrorDesc) {
    console.error(err);
    // todo: move Modal to AppService impl
    // hack: when https://github.com/vueComponent/ant-design-vue/pull/4632 is merged, `constant` is no need
    Modal.error({
      title: constant(desc?.title || err.name),
      content: constant(desc?.message ?? err.message),
    });
  }
}
