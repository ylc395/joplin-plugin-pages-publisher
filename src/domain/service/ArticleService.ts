import { ref, Ref, computed, InjectionKey, shallowReactive } from 'vue';
import { find, filter, pull, negate, map, uniq } from 'lodash';
import { singleton } from 'tsyringe';
import type { Note, File } from '../model/JoplinData';
import type { Article } from '../model/Article';
import { JoplinDataRepository } from '../repository/JoplinDataRepository';
import { PluginDataRepository } from '../repository/PluginDataRepository';

export interface SearchedNote extends Note {
  status: 'none' | 'published' | 'unpublished';
}

export const token: InjectionKey<ArticleService> = Symbol('articleService');

@singleton()
export class ArticleService {
  private readonly articles: Article[] = shallowReactive([]);
  private readonly joplinDataRepository = new JoplinDataRepository();
  private readonly pluginDataRepository = new PluginDataRepository();

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
    return uniq(map(this.publishedArticles.value, 'tags').flat());
  }

  private async init() {
    const articles = await this.pluginDataRepository.getArticles();
    this.articles.push(...(articles ?? []));
  }

  private saveArticles() {
    this.pluginDataRepository.saveArticles(this.articles);
  }

  async searchNotes(keyword: string) {
    if (!keyword) {
      this._searchedNotes.value = [];
      return;
    }

    const notes = await this.joplinDataRepository.searchNotes(keyword);
    this._searchedNotes.value = notes;
  }

  private async noteToArticle(note: Note): Promise<Article> {
    const [tags, files] = await Promise.all([
      this.joplinDataRepository.getTagsOf(note.id),
      this.joplinDataRepository.getFilesOf(note.id),
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
    const articles = await Promise.all(notes.map(this.noteToArticle.bind(this)));
    this.articles.push(...articles);
    await this.saveArticles();
  }

  async remove(...articles: Article[]) {
    pull(this.articles, ...articles);
    await this.saveArticles();
  }

  async unpublish(...articles: Article[]) {
    for (const article of articles) {
      article.published = false;
    }
    await this.saveArticles();
  }
}
