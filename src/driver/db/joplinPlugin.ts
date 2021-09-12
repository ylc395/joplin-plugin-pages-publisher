import joplin from 'api';
import { get, set } from 'lodash';
import { Low } from 'lowdb/lib';
import { singleton } from 'tsyringe';
import { JSONFile } from './adaptor';

@singleton()
export class Db {
  private db: Low<Record<string, unknown>> | null = null;
  private ready = new Promise((resolve) => {
    this.init().then(resolve);
  });
  private async init() {
    const pluginDir = await joplin.plugins.dataDir();
    this.db = new Low(new JSONFile(`${pluginDir}/db.json`));
    await this.db.read();

    if (this.db.data === null) {
      this.db.data = {};
    }
  }

  fetch<T>(path: string[]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.ready.then<T | null>(() => get(this.db!.data, path, null));
  }

  save(path: string[], data: unknown) {
    return this.ready.then(() => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      set(this.db!.data!, path, data);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.db!.write();
    });
  }
}
