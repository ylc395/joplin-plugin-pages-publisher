import joplin from 'api';
import type {
  readFileSync as IReadFileSync,
  outputFile as IOutputFile,
  copy as ICopy,
  readFile as IReadFile,
  writeFile as IWriteFile,
} from 'fs-extra';

export const { readFileSync, outputFile, copy, writeFile, readFile } = joplin.require(
  'fs-extra',
) as {
  readFileSync: typeof IReadFileSync;
  outputFile: typeof IOutputFile;
  copy: typeof ICopy;
  readFile: typeof IReadFile;
  writeFile: typeof IWriteFile;
};
