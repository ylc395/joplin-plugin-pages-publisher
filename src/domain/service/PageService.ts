import { container, singleton } from 'tsyringe';
import { Ref, shallowRef, watchEffect, InjectionKey } from 'vue';
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

  private async initPages() {
    const { site } = this.siteService;

    if (!site.value?.themeConfig) {
      return;
    }

    const pagesVars =
      (await this.pluginDataRepository.getFieldVarsOfTheme(site.value.themeName)) || {};

    this.pages.value = Object.keys(site.value.themeConfig.pages).map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (pageName) => new Page(pageName, pagesVars[pageName] || {}, site.value!),
    );
  }

  savePage(page: Page, vars: Vars) {
    const themeName = this.siteService.site.value?.themeName;

    if (!themeName) {
      throw new Error('no theme name when save page');
    }

    Object.assign(page.fieldVars, vars);
    return this.pluginDataRepository.saveFieldVars(themeName, page.name, vars);
  }

  isValidUrl(url: string, pageName: string) {
    return this.pages.value.every((page) => {
      const path = page.url.value.split('/')[1];
      return page.name === pageName || path !== url;
    });
  }
}
