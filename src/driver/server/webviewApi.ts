import { container } from 'tsyringe';
import { serverToken } from 'domain/service/PreviewService';

export interface ServerRequest {
  event: 'startServer' | 'closeServer';
}

declare const webviewApi: {
  postMessage: <T>(payload: ServerRequest) => Promise<T>;
};

container.registerInstance(serverToken, {
  start() {
    return webviewApi.postMessage({ event: 'startServer' });
  },
  close() {
    return webviewApi.postMessage({ event: 'closeServer' });
  },
});
