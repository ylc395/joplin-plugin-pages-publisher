import { container } from 'tsyringe';
import type { Note, Tag, Resource, File } from '../model/JoplinData';
import { joplinToken } from '../service/AppService';

export class JoplinDataRepository {
  private joplin = container.resolve(joplinToken);
  searchNotes(query: string) {
    const fields = 'id,title';
    return this.joplin.fetchAllData<Note>(['search'], { query, fields });
  }

  getTagsOf(noteId: string) {
    return this.joplin.fetchAllData<Tag>(['notes', noteId, 'tags']);
  }

  async getFilesOf(noteId: string) {
    const resources = await this.joplin.fetchAllData<Resource>(['notes', noteId, 'resources'], {
      fields: 'id,mime',
    });

    if (resources.length === 0) {
      return [];
    }

    const files = await Promise.all(
      resources.map(({ id }) => this.joplin.fetchData<File>(['resources', id, 'file'])),
    );

    return files;
  }

  async getNote(noteId: string) {
    const note = await this.joplin.fetchData<Required<Note>>(['notes', noteId], {
      fields: 'id,title,user_created_time,user_updated_time,body',
    });

    return note;
  }

  async getGithubToken() {
    try {
      return await this.joplin.fetchPluginSetting<string>('githubToken');
    } catch {
      return '';
    }
  }
}
