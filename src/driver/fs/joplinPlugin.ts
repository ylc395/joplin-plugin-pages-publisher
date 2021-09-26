import joplin from 'api';
import type FsExtra from 'fs-extra';
import { functionsIn, isObjectLike, isBuffer, toPlainObject } from 'lodash';
import type { MockNodeFsCallResult } from './type';

const fs = joplin.require('fs-extra') as typeof FsExtra;

export default fs;

export async function getAllFiles(dir: string, files_: string[] = []) {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const fullPath = `${dir}/${file}`;
    const status = await fs.stat(fullPath);
    if (status.isDirectory()) {
      await getAllFiles(fullPath, files_);
    } else {
      files_.push(fullPath);
    }
  }

  return files_;
}

function isInFs(key: string): key is keyof typeof FsExtra {
  return key in fs;
}

export async function mockNodeFsCall(
  funcName: string,
  ...args: unknown[]
): Promise<MockNodeFsCallResult> {
  if (!isInFs(funcName)) {
    throw new Error(`invalid call: ${funcName}`);
  }

  try {
    const result = await (fs[funcName] as CallableFunction)(...args);
    const methodsResult =
      isObjectLike(result) && !isBuffer(result) && !Array.isArray(result)
        ? functionsIn(result).reduce((res, methodName) => {
            res[methodName] = result[methodName]();
            return res;
          }, {} as MockNodeFsCallResult['methodsResult'])
        : {};

    return { isError: false, result, methodsResult };
  } catch (error) {
    // joplin webview will modify our error object, this behavior break the isomorphic-git
    // so we transform error to promise resolve value
    return { isError: true, result: toPlainObject(error), methodsResult: {} };
  }
}
