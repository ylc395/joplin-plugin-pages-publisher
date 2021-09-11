import { ref, computed, InjectionKey, reactive, toRaw } from 'vue';
import { filter, pull, negate, uniq, findIndex, sortBy, compact } from 'lodash';
import { singleton } from 'tsyringe';
import isValidFilename from 'valid-filename';
import type { File } from '../model/JoplinData';
import { Article, getSyncStatus } from '../model/Article';
import { JoplinDataRepository } from '../repository/JoplinDataRepository';
import { PluginDataRepository } from '../repository/PluginDataRepository';

export const token: InjectionKey<ArticleService> = Symbol('articleService');

@singleton()
export class ArticleService {
  readonly articles = reactive<Article[]>([]);
  readonly selectedArticles = ref<Article[]>([]);
  private readonly joplinDataRepository = new JoplinDataRepository();
  private readonly pluginDataRepository = new PluginDataRepository();

  readonly unpublishedArticles = computed(() => {
    return filter(this.articles, { published: false });
  });
  readonly publishedArticles = computed(() => {
    return filter(this.articles, { published: true });
  });
  constructor() {
    this.init();
  }

  private async init() {
    const articles = sortBy(await this.pluginDataRepository.getArticles(), ['createdAt']).reverse();

    if (articles) {
      const notes = await Promise.all(
        articles.map(({ noteId }) => this.joplinDataRepository.getNote(noteId)),
      );

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const article = articles[i];

        article.note = note;
        article.syncStatus = getSyncStatus(article, note);
      }
    }

    this.articles.push(...(articles ?? []));
  }

  saveArticles() {
    return this.pluginDataRepository.saveArticles(toRaw(this.articles));
  }

  async loadArticle(article: Article) {
    const files = compact(await this.joplinDataRepository.getFilesOf(article.noteId));

    const isImage = ({ contentType }: File) => {
      return contentType.startsWith('image');
    };

    article.images = files.filter(isImage);
    article.attachments = files.filter(negate(isImage));
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
    const index = findIndex(this.articles, { noteId: article.noteId });

    if (index < 0) {
      throw new Error('can not find article');
    }

    Object.assign(this.articles[index], article);
    return this.saveArticles();
  }

  isValidUrl(newUrl: string, noteId?: unknown) {
    if (!isValidFilename(newUrl)) {
      return false;
    }

    for (const article of this.articles) {
      if (article.noteId !== noteId && article.url === newUrl) {
        return false;
      }
    }

    return true;
  }

  syncArticleContent(article: Article) {
    if (article.note?.body === undefined) {
      throw new Error('no noteContent when updating');
    }

    article.content = article.note.body;
    article.updatedAt = article.note.user_updated_time;
    article.syncStatus = 'synced';
    this.saveArticle(article);
  }

  getValidUrl(baseUrl: string) {
    let url = isValidFilename(baseUrl) ? baseUrl : 'untitled';
    let index = 1;

    while (!this.isValidUrl(url)) {
      url = `${baseUrl}-${index}`;
      index++;
    }

    return url;
  }
}
