import joplin from 'api';
import type {
  readFileSync as IReadFileSync,
  outputFile as IOutputFile,
  pathExists as IPathExists,
  copy as ICopy,
  readFile as IReadFile,
  writeFile as IWriteFile,
  move as IMove,
  remove as IRemove,
  readdir as IReaddir,
  stat as IStat,
} from 'fs-extra';
import { functionsIn, isObjectLike, isBuffer, toPlainObject } from 'lodash';
import type { MockNodeFsCallResult } from './type';

const fs = joplin.require('fs-extra');

const {
  readFileSync,
  outputFile,
  copy,
  writeFile,
  readFile,
  move,
  pathExists,
  remove,
  readdir,
  stat,
} = fs as {
  readFileSync: typeof IReadFileSync;
  outputFile: typeof IOutputFile;
  copy: typeof ICopy;
  readFile: typeof IReadFile;
  writeFile: typeof IWriteFile;
  move: typeof IMove;
  pathExists: typeof IPathExists;
  remove: typeof IRemove;
  readdir: typeof IReaddir;
  stat: typeof IStat;
};

export { readFileSync, outputFile, copy, writeFile, readFile, move, remove, pathExists };

export async function getAllFiles(dir: string, files_: string[] = []) {
  const files = await readdir(dir);

  for (const file of files) {
    const fullPath = `${dir}/${file}`;
    const status = await stat(fullPath);
    if (status.isDirectory()) {
      await getAllFiles(fullPath, files_);
    } else {
      files_.push(fullPath);
    }
  }

  return files_;
}

export async function mockNodeFsCall(
  funcName: string,
  ...args: unknown[]
): Promise<MockNodeFsCallResult> {
  try {
    const result = await fs[funcName](...args);
    const methodsResult =
      isObjectLike(result) && !isBuffer(result)
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
