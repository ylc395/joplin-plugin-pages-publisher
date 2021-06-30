import { Ref, shallowRef } from 'vue';
import type { Article } from '../model/Article';
import { Page, HomePage, ArticlePage, ArchivesPage, TagPage, CustomPage } from '../model/Page';

export class PageService {
  readonly templates: Ref<Page[]> = shallowRef([]);
  generateArticlePage(article: Article) {
    const articlePage = new ArchivesPage(article);
  }

  private init() {}
  private;
}
