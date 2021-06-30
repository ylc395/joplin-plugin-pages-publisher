import { ref, Ref, computed, InjectionKey } from 'vue';
import { find, filter, pull, negate } from 'lodash';
import type { Note, File } from './model/JoplinData';
import type { Article } from './model/Site';
import Repository from './RepositoryService';
interface SearchedNote extends Note {
  status: 'none' | 'published' | 'unpublished';
}

export const token: InjectionKey<ArticleService> = Symbol();
export class ArticleService {
  private readonly articles: Ref<Article[]> = ref([]);
  readonly unpublishedArticles = computed(() => {
    return filter(this.articles.value, { published: false });
  });
  readonly publishedArticles = computed(() => {
    return filter(this.articles.value, { published: true });
  });
  private readonly _searchedNotes: Ref<Note[]> = ref([]);
  readonly searchedNotes = computed<SearchedNote[]>(() => {
    return this._searchedNotes.value.map((note) => {
      const status = (() => {
        const idMatch = { noeId: note.id };
        if (find(this.publishedArticles.value, idMatch)) {
          return 'published';
        }

        if (find(this.unpublishedArticles.value, idMatch)) {
          return 'unpublished';
        }

        return 'none';
      })();

      return { ...note, status };
    });
  });
  constructor() {
    this.init();
  }

  private async init() {
    const articles = await Repository.getArticles();
    this.articles.value = articles;
  }

  private saveArticles() {
    Repository.saveArticles(this.articles.value);
  }

  async searchNotes(keyword: string) {
    if (!keyword) {
      this._searchedNotes.value = [];
      return;
    }

    const notes = await Repository.searchNotes(keyword);
    this._searchedNotes.value = notes;
  }

  private static async noteToArticle(note: Note): Promise<Article> {
    const [tags, files] = await Promise.all([
      Repository.getTagsOf(note.id),
      Repository.getFilesOf(note.id),
    ]);

    const isImage = ({ contentType }: File) => {
      return contentType.startsWith('image');
    };

    return {
      published: false,
      sourceStatus: 'normal',
      noteId: note.id,
      title: note.title,
      createdAt: new Date(note.user_created_time),
      updatedAt: new Date(note.user_updated_time),
      tags,
      images: files.filter(isImage),
      attachments: files.filter(negate(isImage)),
    };
  }

  async addAsArticles(...notes: Note[]) {
    const articles = await Promise.all(notes.map(ArticleService.noteToArticle));
    this.articles.value.push(...articles);
    await this.saveArticles();
  }

  async remove(...articles: Article[]) {
    pull(this.articles.value, ...articles);
    await this.saveArticles();
  }
}
