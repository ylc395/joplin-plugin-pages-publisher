import { ref, Ref, computed, InjectionKey, reactive } from 'vue';
import { find, filter, pull, negate, map, uniq, remove, findIndex } from 'lodash';
import { singleton } from 'tsyringe';
import type { Note, File } from '../model/JoplinData';
import type { Article } from '../model/Article';
import { JoplinDataRepository } from '../repository/JoplinDataRepository';
import { PluginDataRepository } from '../repository/PluginDataRepository';
import slugify from 'slugify';

interface SearchedNote extends Note {
  status: 'none' | 'published' | 'unpublished';
}

export const token: InjectionKey<ArticleService> = Symbol('articleService');

@singleton()
export class ArticleService {
  private readonly articles = reactive<Article[]>([]);
  readonly selectedArticles = ref<Article[]>([]);
  private readonly joplinDataRepository = new JoplinDataRepository();
  private readonly pluginDataRepository = new PluginDataRepository();

  readonly unpublishedArticles = computed(() => {
    return filter(this.articles, { published: false });
  });
  readonly publishedArticles = computed(() => {
    return filter(this.articles, { published: true });
  });
  private readonly notesToBeAdded = ref<Note[]>([]);
  private readonly _searchedNotes: Ref<Note[]> = ref([]);
  readonly searchedNotes = computed<SearchedNote[]>(() => {
    return this._searchedNotes.value.map((note) => {
      const status = (() => {
        const idMatch = { noteId: note.id };

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

    if (articles) {
      const contents = await Promise.all(
        articles.map(({ noteId }) => this.joplinDataRepository.getNoteContentOf(noteId)),
      );

      for (let i = 0; i < contents.length; i++) {
        articles[i].noteContent = contents[i];
      }
    }

    this.articles.push(...(articles ?? []));
  }

  private saveArticles() {
    return this.pluginDataRepository.saveArticles(this.articles);
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
    const [tags, noteContent] = await Promise.all([
      this.joplinDataRepository.getTagsOf(note.id),
      this.joplinDataRepository.getNoteContentOf(note.id),
    ]);

    return {
      published: false,
      noteId: note.id,
      title: note.title,
      createdAt: note.user_created_time,
      updatedAt: note.user_updated_time,
      tags: map(tags, 'title'),
      noteContent,
      content: noteContent,
      url: slugify(note.title, { lower: true }) || 'untitled',
      coverImg: null,
    };
  }

  async loadArticle(article: Article) {
    const [files, noteContent] = await Promise.all([
      this.joplinDataRepository.getFilesOf(article.noteId),
      this.joplinDataRepository.getNoteContentOf(article.noteId),
    ]);

    const isImage = ({ contentType }: File) => {
      return contentType.startsWith('image');
    };

    article.images = files.filter(isImage);
    article.attachments = files.filter(negate(isImage));
    article.noteContent = noteContent;
    article.content = article.content ?? noteContent;
  }

  addNote(noteId: string) {
    const note = find(this._searchedNotes.value, { id: noteId });

    if (!note) {
      throw new Error(`no note for id ${noteId}`);
    }

    this.notesToBeAdded.value.push(note);
  }

  removeNote(noteId: string) {
    remove(this.notesToBeAdded.value, { id: noteId });
  }

  async submitAsArticles() {
    const articles = await Promise.all(
      this.notesToBeAdded.value.map(this.noteToArticle.bind(this)),
    );

    for (const article of articles) {
      if (!this.isValidUrl(article.url)) {
        article.url = this.getValidUrl(article.url);
      }

      this.articles.push(article);
    }

    this.notesToBeAdded.value = [];
    await this.saveArticles();
  }

  async removeArticles() {
    pull(this.articles, ...this.selectedArticles.value);
    this.selectedArticles.value = [];
    await this.saveArticles();
  }

  async togglePublished(status: 'published' | 'unpublished') {
    const articles: Article[] = [];

    for (const article of this.selectedArticles.value) {
      if (status === 'published' ? !article.published : article.published) {
        article.published = status === 'published' ? true : false;
        articles.push(article);
      }
    }

    pull(this.selectedArticles.value, ...articles);
    await this.saveArticles();
  }

  toggleArticleSelected(article: Article) {
    if (this.selectedArticles.value.includes(article)) {
      pull(this.selectedArticles.value, article);
    } else {
      this.selectedArticles.value.push(article);
    }
  }

  selectAll(status: 'published' | 'unpublished') {
    const articles =
      status === 'published' ? this.publishedArticles.value : this.unpublishedArticles.value;

    this.selectedArticles.value = uniq(this.selectedArticles.value.concat(articles));
  }

  saveArticle(article: Partial<Article>) {
    if (!article.noteId) {
      throw new Error('no article noteId when saving');
    }

    const index = findIndex(this.articles, { noteId: article.noteId });

    if (!this.articles[index]) {
      throw new Error('no article when saving');
    }

    Object.assign(this.articles[index], article);
    return this.saveArticles();
  }

  isValidUrl(newUrl: string, noteId?: string) {
    for (const article of this.articles) {
      if (article.noteId !== noteId && article.url === newUrl) {
        return false;
      }
    }

    return true;
  }

  updateArticle(article: Article) {
    if (article.noteContent === undefined) {
      throw new Error('no noteContent when updating');
    }

    article.content = article.noteContent;
    article.updatedAt = Date.now();
  }

  private getValidUrl(baseUrl: string) {
    let url = baseUrl;
    let index = 1;

    while (!this.isValidUrl(url)) {
      url = `${baseUrl}-${index}`;
      index++;
    }

    return url;
  }
}
