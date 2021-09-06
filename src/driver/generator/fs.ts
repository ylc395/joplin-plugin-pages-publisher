import joplin from 'api';
import type {
  readFileSync as IReadFileSync,
  outputFile as IOutputFile,
  copy as ICopy,
} from 'fs-extra';

export const { readFileSync, outputFile, copy } = joplin.require('fs-extra') as {
  readFileSync: typeof IReadFileSync;
  outputFile: typeof IOutputFile;
  copy: typeof ICopy;
};
