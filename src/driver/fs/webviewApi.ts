import fsExtra from 'fs-extra';

import { constant, isTypedArray, isObjectLike, isString, mapValues } from 'lodash';
import type { MockNodeFsCallResult } from './type';

export interface FsRequest {
  event: 'fsCall';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[];
  funcName: string;
}

declare const webviewApi: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage: (res: FsRequest) => Promise<MockNodeFsCallResult>;
};

const cache = new Map();
const fs = {
  promises: new Proxy(
    {},
    {
      get(_, funcName) {
        if (!isString(funcName)) {
          throw new Error('Not handle non-string fs function name');
        }

        if (!cache.has(funcName)) {
          cache.set(funcName, (...args: unknown[]) => {
            return webviewApi
              .postMessage({ event: 'fsCall', funcName, args })
              .then(({ isError, result, methodsResult }) => {
                if (isError) {
                  throw result;
                }

                // buffer here is Unit8Array
                if (!isObjectLike(result) || isTypedArray(result) || Array.isArray(result)) {
                  return result;
                }

                return {
                  ...(result as Record<string, unknown>),
                  ...mapValues(methodsResult, constant),
                };
              });
          });
        }
        return cache.get(funcName);
      },
    },
  ) as typeof fsExtra,
};

export default fs;
