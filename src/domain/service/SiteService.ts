import { container, singleton } from 'tsyringe';
import { Ref, ref, watchEffect } from 'vue';
import type { Site } from '../model/Site';
import { PluginDataRepository } from '../repository/PluginDataRepository';
import { ArticleService } from './ArticleService';

const defaultSite: Site = {
  name: '',
  description: '',
  themeName: 'default',
  themeConfig: null,
  language: '',
  icon: null,
  RSSMode: 'full',
  RSSLength: 10,
  menu: [],
  articlePagePrefix: 'article',
  archivesPagePrefix: 'archives',
  tagPagePrefix: 'tag',
  footer: '',
  generatedAt: null,
  articles: [],
  tags: [],
};

@singleton()
export class SiteService {
  readonly site: Ref<null | Site> = ref(null);
  private readonly articleService = container.resolve(ArticleService);
  constructor() {
    this.init();
  }
  private async init() {
    this.site.value = { ...defaultSite, ...(await PluginDataRepository.getSite()) };
    watchEffect(this.loadTheme.bind(this));
    watchEffect(this.loadArticles.bind(this));
  }

  private loadArticles() {
    if (!this.site.value) {
      throw new Error('site is not initialized');
    }

    this.site.value.articles = this.articleService.publishedArticles.value;
    this.site.value.tags = this.articleService.allTags;
  }

  private async loadTheme() {
    if (!this.site.value) {
      throw new Error('site is not initialized');
    }

    const site = this.site.value;

    if (site.themeName === site.themeConfig?.name) {
      throw new Error('do not load the same theme');
    }

    const theme = await PluginDataRepository.getTheme(site.themeName);
    this.site.value.themeConfig = theme;
  }

  async saveSite(site: Partial<Site>) {
    if (!this.site.value) {
      throw new Error('site is not initialized');
    }

    await PluginDataRepository.saveSite(Object.assign(this.site.value, site));
  }
}
