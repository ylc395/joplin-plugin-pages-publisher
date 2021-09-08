import joplin from 'api';
import type {
  readFileSync as IReadFileSync,
  outputFile as IOutputFile,
  copy as ICopy,
  readFile as IReadFile,
  writeFile as IWriteFile,
  rename as IRename,
  remove as IRemove,
  readdir as IReaddir,
  stat as IStat,
} from 'fs-extra';

const { readFileSync, outputFile, copy, writeFile, readFile, rename, remove, readdir, stat } =
  joplin.require('fs-extra') as {
    readFileSync: typeof IReadFileSync;
    outputFile: typeof IOutputFile;
    copy: typeof ICopy;
    readFile: typeof IReadFile;
    writeFile: typeof IWriteFile;
    rename: typeof IRename;
    remove: typeof IRemove;
    readdir: typeof IReaddir;
    stat: typeof IStat;
  };

export { readFileSync, outputFile, copy, writeFile, readFile, rename, remove };

export async function getAllFiles(dir: string, files_: string[] = []) {
  const files = await readdir(dir);

  for (const file of files) {
    const status = await stat(file);
    if (status.isDirectory()) {
      getAllFiles(file, files_);
    } else {
      files_.push(file);
    }
  }

  return files_;
}
