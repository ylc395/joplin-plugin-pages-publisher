import { container, singleton } from 'tsyringe';
import { Ref, shallowRef, watchEffect, InjectionKey, computed } from 'vue';
import { find } from 'lodash';
import isValidFilename from 'valid-filename';
import { Page, Vars } from '../model/Page';
import { SiteService } from './SiteService';
import { PluginDataRepository } from '../repository/PluginDataRepository';

export const token: InjectionKey<PageService> = Symbol('pageService');
export type PagesFieldVars = Record<string, Vars | undefined>;

@singleton()
export class PageService {
  private readonly siteService = container.resolve(SiteService);
  private readonly pluginDataRepository = new PluginDataRepository();
  readonly pages: Ref<Page[]> = shallowRef([]);
  constructor() {
    watchEffect(this.initPages.bind(this));
  }

  readonly articlePage = computed(() => {
    return find(this.pages.value, { isArticlePage: true });
  });

  private async initPages() {
    const { site, themeConfig } = this.siteService;

    if (!site.value || !themeConfig.value || site.value.themeName !== themeConfig.value.name) {
      return;
    }

    const themeName = site.value.themeName;
    const pagesVars = (await this.pluginDataRepository.getFieldVarsOfTheme(themeName)) || {};

    this.pages.value = Object.keys(themeConfig.value.pages).map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (pageName) => new Page(pageName, pagesVars[pageName] || {}, themeConfig.value!),
    );
  }

  savePage(page: Page, vars: Vars) {
    const themeName = this.siteService.site.value?.themeName;

    if (!themeName) {
      throw new Error('no theme name when save page');
    }

    page.setValues(vars);
    return this.pluginDataRepository.saveFieldVars(themeName, page.name, page.outputValues());
  }

  isValidUrl(url: string, pageName: string) {
    if (!isValidFilename(url) || url.startsWith('_')) {
      return false;
    }

    return this.pages.value.every((page) => {
      const path = page.url.value.split('/')[1];
      return page.name === pageName || path !== url;
    });
  }
}
