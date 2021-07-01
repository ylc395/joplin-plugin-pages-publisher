import { container } from 'tsyringe';
import { Ref, shallowRef, watchEffect } from 'vue';
import { Page, HomePage, CustomPage, ArticlePage } from '../model/Page';
import { ArticleService } from './ArticleService';
import { SiteService } from './SiteService';
import { PluginDataRepository } from '../repository/PluginDataRepository';
import { Article } from '../model/Article';

export class PageService {
  private readonly articleService = container.resolve(ArticleService);
  private readonly siteService = container.resolve(SiteService);
  readonly displayedPages: Ref<Page[]> = shallowRef([]);
  constructor() {
    watchEffect(this.initDisplayedPages.bind(this));
  }

  get site() {
    const { site } = this.siteService;

    if (!site.value) {
      throw new Error('site is not initialized yet');
    }

    const { allTags, publishedArticles } = this.articleService;
    return { ...site.value, tags: allTags, articles: publishedArticles.value };
  }

  async getAllPages() {
    const { theme, site } = this.siteService;
    const { allTags, publishedArticles } = this.articleService;

    if (!theme.value || !site.value) {
      return;
    }

    const articlePageCreator = this.createArticlePage.bind(this);
    return [...this.displayedPages.value, ...publishedArticles.value.map(articlePageCreator)];
  }

  private async initDisplayedPages() {
    const { theme, site } = this.siteService;
    const { allTags, publishedArticles } = this.articleService;

    if (!theme.value || !site.value) {
      return;
    }

    const pagesFields = (await PluginDataRepository.getFieldVarsOfTheme(theme.value.name)) || {};
    const pages = [];
    const _site = { ...site.value, tags: allTags, articles: publishedArticles.value };

    for (const pageName of Object.keys(theme.value.pages)) {
      const themeFields = theme.value.pages[pageName] || [];
      const page =
        pageName === HomePage.pageName
          ? new HomePage(_site, themeFields)
          : new CustomPage(pageName, _site, themeFields);

      page.setFieldVars(pagesFields[page.pageId] || {});
      pages.push(page);
    }

    this.displayedPages.value = pages;
  }

  async createArticlePage(article: Article) {
    const { theme } = this.siteService;

    if (!theme.value) {
      throw new Error('theme is not loaded yet');
    }

    const fields = theme.value.pages[ArticlePage.pageName] || [];
    const articlePage = new ArticlePage(article, this.site, fields);
    const pageId = articlePage.pageId;
    const pages = await PluginDataRepository.getFieldVarsOfTheme(theme.value.name);
    const fieldVars = pages?.[pageId] ?? {};

    articlePage.setFieldVars(fieldVars);

    return articlePage;
  }
}
