import type { Adapter } from 'lowdb';
import { readFile, writeFile } from '../fs';

export class JSONFile<T> implements Adapter<T> {
  constructor(private readonly filename: string) {}
  async read(): Promise<T | null> {
    let data;

    try {
      data = await readFile(this.filename, 'utf-8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw e;
    }

    return JSON.parse(data) as T;
  }

  write(data: T): Promise<void> {
    return writeFile(this.filename, JSON.stringify(data, null, 2));
  }
}
