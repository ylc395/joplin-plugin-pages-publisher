import { Ref, shallowRef } from 'vue';
import {
  HomePage,
  ArticlePage,
  ArchivesPage,
  TagsPage,
  TagPage,
  Page,
} from './model/Page';
import Repository from './RepositoryService';
export class SiteService {
  pages: Ref<Page[]> = shallowRef([]);
  private async init() {
  }

  static getCustomFieldOptionsOf(page: string) {
    Repository.
  }
}
