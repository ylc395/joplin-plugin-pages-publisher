/*  eslint-env worker*/
/// <reference lib="WebWorker" />
import type fsExtra from 'fs-extra';

import { isString, uniqueId, constant, mapValues, isEmpty } from 'lodash';
import { FsWorkerCallResponse, FsWorkerCallRequest } from './type';

const cache = new Map();

export default {
  promises: new Proxy(
    {},
    {
      get(_, funcName: keyof typeof fsExtra) {
        if (!isString(funcName)) {
          throw new Error('Not handle non-string fs function name');
        }

        if (!cache.has(funcName)) {
          cache.set(funcName, (...args: unknown[]) => {
            return new Promise((resolve, reject) => {
              const callId = uniqueId('fsCall');

              self.addEventListener(
                'message',
                function handler(e: MessageEvent<FsWorkerCallResponse>) {
                  if (e.data?.event !== 'fsCallResponse' || e.data?.payload?.callId !== callId) {
                    return;
                  }

                  self.removeEventListener('message', handler);

                  if (e.data.payload.isError) {
                    reject(e.data.payload.result);
                    return;
                  }

                  const result = isEmpty(e.data.payload.methodsResult)
                    ? e.data.payload.result
                    : {
                        ...(e.data.payload.result as Record<string, unknown>),
                        ...mapValues(e.data.payload.methodsResult, constant),
                      };

                  resolve(result);
                },
              );

              const request: FsWorkerCallRequest = {
                event: 'fsCall',
                payload: { funcName, args, callId },
              };
              self.postMessage(request);
            });
          });
        }
        return cache.get(funcName);
      },
    },
  ) as typeof fsExtra,
};
