import { container, InjectionToken } from 'tsyringe';
import type joplin from 'api';
import type { Note, Tag, Resource, File } from '../model/JoplinData';

export interface JoplinFetcher {
  fetchData: <T>(...args: Parameters<typeof joplin['data']['get']>) => Promise<T>;
  fetchAllData: <T>(...args: Parameters<typeof joplin['data']['get']>) => Promise<T[]>;
}

export const token: InjectionToken<JoplinFetcher> = Symbol();
export class JoplinDataRepository {
  private static joplinFetcher = container.resolve(token);
  static searchNotes(query: string) {
    const fields = 'id,title,user_created_time,user_updated_time';
    return this.joplinFetcher.fetchAllData<Note>(['search'], { query, fields });
  }

  static getTagsOf(noteId: string) {
    return this.joplinFetcher.fetchAllData<Tag>(['notes', noteId, 'tags']);
  }

  static async getFilesOf(noteId: string) {
    const resources = await this.joplinFetcher.fetchAllData<Resource>(
      ['notes', noteId, 'resources'],
      { fields: 'id,mime' },
    );

    if (resources.length === 0) {
      return [];
    }

    const files = await Promise.all(
      resources.map(({ id }) => this.joplinFetcher.fetchData<File>(['resources', id, 'file'])),
    );

    return files;
  }
}
