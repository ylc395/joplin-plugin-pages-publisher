import { container, singleton } from 'tsyringe';
import { AppService } from './AppService';

interface ErrorDesc {
  title?: string;
  message?: string;
}
@singleton()
export class ExceptionService {
  private readonly appService = container.resolve(AppService);
  constructor() {
    window.addEventListener('error', (e) => this.reportError(e.error));
    window.addEventListener('unhandledrejection', (e) => this.reportError(Error(e.reason)));
  }

  reportError(err: Error, desc?: ErrorDesc) {
    console.error(err);
    this.appService.openModal({
      type: 'error',
      title: desc?.title ?? err.name,
      content: desc?.message ?? err.message,
    });
  }
}
