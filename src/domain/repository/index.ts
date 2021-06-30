import { fetchAllData, fetchData, getDataFromDb, saveDbToData } from '../../driver/webviewApi';
import type { Article } from '../model/Site';
import type { PageFields } from '../model/Page';
import { Note, Tag, Resource, File } from '../model/JoplinData';

class Repository {
  static searchNotes(query: string) {
    const fields = 'id,title,user_created_time,user_updated_time';
    return fetchAllData<Note>(['search'], { query, fields });
  }

  static async getArticles() {
    const { articles } = await getDataFromDb('articles');
    return articles;
  }

  static getTagsOf(noteId: string) {
    return fetchAllData<Tag>(['notes', noteId, 'tags']);
  }

  static async getFilesOf(noteId: string) {
    const resources = await fetchAllData<Resource>(['notes', noteId, 'resources'], {
      fields: 'id,mime',
    });

    if (resources.length === 0) {
      return [];
    }

    const files = await Promise.all(
      resources.map(({ id }) => fetchData<false, File>(['resources', id, 'file'])),
    );

    return files;
  }

  static async saveArticles(articles: Article[]) {
    await saveDbToData({ dataType: 'articles', data: articles });
  }

  static async getPageCustomFields(theme: string, pageName: string) {
    const pageFields = (await getDataFromDb()).theme[theme]?.pages[pageName];
    return pageFields || {};
  }

  static async savePageCustomFields(page: string, values: PageFieldValues) {
    await saveDbToData({ dataType: 'pages', data: { page, values } });
  }

  static async getPageCustomFieldOptions(page: string) {}
}

export default Repository;
