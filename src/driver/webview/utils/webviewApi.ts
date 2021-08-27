import { ExceptionService } from '../../../domain/service/ExceptionService';
import { container } from 'tsyringe';

const exceptionService = container.resolve(ExceptionService);

export interface AppRequest {
  event: 'quitApp' | 'generateSite';
}

declare const webviewApi: {
  postMessage: (payload: AppRequest) => Promise<void>;
};

export function quitApp() {
  webviewApi.postMessage({ event: 'quitApp' });
}

export function generateSite() {
  webviewApi
    .postMessage({ event: 'generateSite' })
    .catch((e) => exceptionService.throwError(e.message));
}
