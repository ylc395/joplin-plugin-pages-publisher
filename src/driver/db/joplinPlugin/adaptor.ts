import type { Adapter } from 'lowdb';
import fs from 'driver/fs/joplinPlugin';

export class JSONFile<T> implements Adapter<T> {
  constructor(private readonly filename: string) {}
  async read(): Promise<T | null> {
    let data;

    try {
      data = await fs.readFile(this.filename, 'utf-8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw e;
    }

    try {
      return JSON.parse(data) as T;
    } catch {
      return { __broken: true } as T & { __broken: true };
    }
  }

  write(data: T): Promise<void> {
    return fs.writeFile(this.filename, JSON.stringify(data, null, 2));
  }
}
