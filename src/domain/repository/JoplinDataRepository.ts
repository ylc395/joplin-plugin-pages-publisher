import { container, InjectionToken } from 'tsyringe';
import type joplin from 'api';
import type { Note, Tag, Resource, File } from '../model/JoplinData';

export type JoplinGetParams = Parameters<typeof joplin['data']['get']>;

interface JoplinFetcher {
  fetchData: <T>(...args: JoplinGetParams) => Promise<T>;
  fetchAllData: <T>(...args: JoplinGetParams) => Promise<T[]>;
}

export const token: InjectionToken<JoplinFetcher> = Symbol('joplinData');
export class JoplinDataRepository {
  private joplinFetcher = container.resolve(token);
  searchNotes(query: string) {
    const fields = 'id,title,user_created_time,user_updated_time';
    return this.joplinFetcher.fetchAllData<Note>(['search'], { query, fields });
  }

  getTagsOf(noteId: string) {
    return this.joplinFetcher.fetchAllData<Tag>(['notes', noteId, 'tags']);
  }

  async getFilesOf(noteId: string) {
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

  async getNoteContentOf(noteId: string) {
    const { body } = await this.joplinFetcher.fetchData<{ body: string }>(['notes', noteId], {
      fields: 'body',
    });

    return body;
  }
}
