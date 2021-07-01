import { singleton } from 'tsyringe';
import { Ref, shallowRef, watchEffect } from 'vue';
import type { Site } from '../model/Site';
import type { Theme } from '../model/Theme';
import { PluginDataRepository } from '../repository/PluginDataRepository';

const defaultSite: Site = {
  theme: 'default',
  name: '',
  description: '',
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
};

@singleton()
export class SiteService {
  site: Ref<Site | null> = shallowRef(null);
  theme: Ref<Theme | null> = shallowRef(null);
  constructor() {
    this.init();
  }
  private async init() {
    this.site.value = { ...defaultSite, ...(await PluginDataRepository.getSite()) };
    watchEffect(this.loadTheme.bind(this));
  }

  private async loadTheme() {
    const site = this.site.value;

    if (!site) {
      throw new Error('no site info when load theme');
    }

    if (site.theme === this.theme.value?.name) {
      return;
    }

    const theme = await PluginDataRepository.getTheme(site.theme);

    this.theme.value = theme;
  }

  async saveSite(site: Site) {
    if (!this.site.value) {
      throw new Error('site info was not initialized when save site');
    }

    await PluginDataRepository.saveSite(site);
    this.site.value = { ...this.site.value, ...(await PluginDataRepository.getSite()) };
  }
}
