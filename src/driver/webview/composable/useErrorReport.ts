import { container } from 'tsyringe';
import { Modal } from 'ant-design-vue';
import { ExceptionService } from '../../../domain/service/ExceptionService';

let isRegistered = false;
const exceptionService = container.resolve(ExceptionService);

export function useErrorReport() {
  if (isRegistered) {
    return;
  }

  exceptionService.on('error', (msg) =>
    Modal.error({ content: msg, title: 'Oops!', style: { whiteSpace: 'pre-wrap' } }),
  );
  isRegistered = true;
}
