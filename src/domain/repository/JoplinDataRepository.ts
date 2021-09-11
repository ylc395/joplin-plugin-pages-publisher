import { container, InjectionToken } from 'tsyringe';
import type joplin from 'api';
import type { Note, Tag, Resource, File } from '../model/JoplinData';

export type JoplinGetParams = Parameters<typeof joplin['data']['get']>;

interface JoplinFetcher {
  fetchData: <T>(...args: JoplinGetParams) => Promise<T | null>;
  fetchAllData: <T>(...args: JoplinGetParams) => Promise<T[]>;
  fetchPluginSetting: <T>(key: string) => Promise<T | null>;
}

export const token: InjectionToken<JoplinFetcher> = Symbol('joplinData');
export class JoplinDataRepository {
  private joplinFetcher = container.resolve(token);
  searchNotes(query: string) {
    const fields = 'id,title';
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

  async getNote(noteId: string) {
    const note = await this.joplinFetcher.fetchData<Required<Note>>(['notes', noteId], {
      fields: 'id,title,user_created_time,user_updated_time,body',
    });

    return note;
  }

  async getGithubToken() {
    try {
      return await this.joplinFetcher.fetchPluginSetting<string>('githubToken');
    } catch {
      return '';
    }
  }
}
