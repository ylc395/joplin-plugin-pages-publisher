import { container, singleton } from 'tsyringe';
import { ref, Ref, shallowRef, watchEffect } from 'vue';
import {
  Page,
  HomePage,
  CustomPage,
  ArticlePage,
  Vars,
  ArchivesPage,
  TagPage,
} from '../model/Page';
import { SiteService } from './SiteService';
import { PluginDataRepository } from '../repository/PluginDataRepository';
import { Article } from '../model/Article';

export type PagesFieldVars = Record<string, Vars | undefined>;
@singleton()
export class PageService {
  private readonly siteService = container.resolve(SiteService);
  private readonly pagesFieldVars: Ref<null | PagesFieldVars> = ref(null);
  readonly pageSingletons: Ref<Page[]> = shallowRef([]);
  constructor() {
    watchEffect(this.initPageSingletons.bind(this));
    watchEffect(this.loadPagesFieldVars.bind(this));
  }

  private async loadPagesFieldVars() {
    const { site } = this.siteService;

    if (!site.value?.themeName) {
      return;
    }

    this.pagesFieldVars.value =
      (await PluginDataRepository.getFieldVarsOfTheme(site.value.themeName)) || {};
  }
  private async initPageSingletons() {
    const { site } = this.siteService;

    if (!this.pagesFieldVars.value || !site.value?.themeConfig) {
      return;
    }

    const { themeConfig } = site.value;
    const pages = [];

    for (const pageName of Object.keys(themeConfig.pages)) {
      const filedVars = this.pagesFieldVars.value[pageName] || {};
      let page: Page;

      switch (pageName) {
        case HomePage.pageName:
          page = new HomePage(site.value, filedVars);
          break;
        case ArticlePage.pageName:
          page = new ArticlePage(site.value, filedVars);
          break;
        case ArchivesPage.pageName:
          page = new ArchivesPage(site.value, filedVars);
          break;
        case TagPage.pageName:
          page = new TagPage(site.value, filedVars);
          break;
        default:
          page = new CustomPage(pageName, site.value, filedVars);
          break;
      }

      pages.push(page);
    }

    this.pageSingletons.value = pages;
  }

  async createArticlePage(article: Article) {
    const { site } = this.siteService;

    if (!site.value) {
      throw new Error('theme is not loaded yet');
    }

    if (!this.pagesFieldVars.value) {
      throw new Error('pages field vars is not loaded yet');
    }

    const fields = this.pagesFieldVars.value[ArticlePage.getPageId(article)] || [];
    const articlePage = new ArticlePage(site.value, fields, article);

    return articlePage;
  }
}
