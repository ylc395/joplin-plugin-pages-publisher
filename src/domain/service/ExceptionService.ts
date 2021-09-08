import { singleton } from 'tsyringe';
import { Modal } from 'ant-design-vue';

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
    Modal.error({ title: desc?.title ?? err.name, content: desc?.message ?? err.message });
  }
}
