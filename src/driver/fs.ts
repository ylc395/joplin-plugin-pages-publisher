import joplin from 'api';
import type {
  readFileSync as IReadFileSync,
  outputFile as IOutputFile,
  copy as ICopy,
  readFile as IReadFile,
  writeFile as IWriteFile,
  rename as IRename,
  remove as IRemove,
} from 'fs-extra';

export const { readFileSync, outputFile, copy, writeFile, readFile, rename, remove } =
  joplin.require('fs-extra') as {
    readFileSync: typeof IReadFileSync;
    outputFile: typeof IOutputFile;
    copy: typeof ICopy;
    readFile: typeof IReadFile;
    writeFile: typeof IWriteFile;
    rename: typeof IRename;
    remove: typeof IRemove;
  };
