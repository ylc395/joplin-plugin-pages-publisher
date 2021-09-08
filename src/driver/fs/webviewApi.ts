import type { PromiseFsClient } from 'isomorphic-git';
import { isString } from 'lodash';

export interface FsRequest {
  event: 'fsCall';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[];
  funcName: string;
}

declare const webviewApi: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage: (res: FsRequest) => Promise<any>;
};

const cache = new Map();
const fs: PromiseFsClient = {
  promises: new Proxy(
    {},
    {
      get(_, funcName) {
        if (!isString(funcName)) {
          throw new Error('Not handle non-string fs function name');
        }

        if (!cache.has(funcName)) {
          cache.set(funcName, (...args: unknown[]) => {
            return webviewApi.postMessage({ event: 'fsCall', funcName, args });
          });
        }
        return cache.get(funcName);
      },
    },
  ) as PromiseFsClient['promises'],
};

export default fs;
