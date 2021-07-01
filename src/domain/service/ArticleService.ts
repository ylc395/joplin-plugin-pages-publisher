import { ref, Ref, computed, InjectionKey, shallowReactive } from 'vue';
import { find, filter, pull, negate, map, flatten, uniq } from 'lodash';
import { singleton } from 'tsyringe';
import type { Note, File } from '../model/JoplinData';
import type { Article } from '../model/Article';
import { JoplinDataRepository } from '../repository/JoplinDataRepository';
import { PluginDataRepository } from '../repository/PluginDataRepository';
interface SearchedNote extends Note {
  status: 'none' | 'published' | 'unpublished';
}

export const token: InjectionKey<ArticleService> = Symbol();

@singleton()
export class ArticleService {
  private readonly articles: Article[] = shallowReactive([]);

  readonly unpublishedArticles = computed(() => {
    return filter(this.articles, { published: false });
  });
  readonly publishedArticles = computed(() => {
    return filter(this.articles, { published: true });
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

  get allTags() {
    const tags = flatten(map(this.articles, 'tags'));

    return uniq(tags);
  }
  private async init() {
    const articles = await PluginDataRepository.getArticles();
    this.articles.push(...(articles ?? []));
  }

  private saveArticles() {
    PluginDataRepository.saveArticles(this.articles);
  }

  async searchNotes(keyword: string) {
    if (!keyword) {
      this._searchedNotes.value = [];
      return;
    }

    const notes = await JoplinDataRepository.searchNotes(keyword);
    this._searchedNotes.value = notes;
  }

  private static async noteToArticle(note: Note): Promise<Article> {
    const [tags, files] = await Promise.all([
      JoplinDataRepository.getTagsOf(note.id),
      JoplinDataRepository.getFilesOf(note.id),
    ]);

    const isImage = ({ contentType }: File) => {
      return contentType.startsWith('image');
    };

    return {
      published: false,
      sourceStatus: 'normal',
      noteId: note.id,
      title: note.title,
      createdAt: note.user_created_time,
      updatedAt: note.user_updated_time,
      tags: map(tags, 'title'),
      images: files.filter(isImage),
      attachments: files.filter(negate(isImage)),
    };
  }

  async addAsArticles(...notes: Note[]) {
    const articles = await Promise.all(notes.map(ArticleService.noteToArticle));
    this.articles.push(...articles);
    await this.saveArticles();
  }

  async remove(...articles: Article[]) {
    pull(this.articles, ...articles);
    await this.saveArticles();
  }
}
