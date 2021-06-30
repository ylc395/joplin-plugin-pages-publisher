import joplin from 'api';
import { Low } from 'lowdb/lib';
import { JSONFile } from './adaptor';
import type { Article } from '../../domain/model/Site';
import type { PageFieldValues } from '../../domain/model/Page';
import { get, set } from 'lodash';

type Pages = Record<string, PageFieldValues>;
export interface DbData {
  theme: Record<string, Pages>;
  articles: Article[];
}

export class Db {
  private db: Low<DbData> | null = null;
  async init() {
    const pluginDir = await joplin.plugins.dataDir();
    this.db = new Low(new JSONFile<DbData>(`${pluginDir}/db.json`));
    await this.db.read();

    if (this.db.data === null) {
      this.db.data = {
        articles: [],
        theme: {},
      };
    }
  }

  read(path: string) {
    if (!this.db || !this.db.data) {
      throw new Error('db is not inited');
    }

    return get(this.db.data, path);
  }

  write(path: string, data: unknown) {
    if (!this.db || !this.db.data) {
      throw new Error('db is not inited');
    }
    set(this.db.data, path, data);
  }
}
