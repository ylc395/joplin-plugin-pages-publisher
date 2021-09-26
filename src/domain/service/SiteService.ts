import { container, singleton } from 'tsyringe';
import { mergeWith, noop, set, defaults, isTypedArray } from 'lodash';
import { Ref, shallowRef, InjectionKey, ref, toRaw } from 'vue';
import { Theme, DEFAULT_THEME_NAME } from '../model/Theme';
import { Site, DEFAULT_SITE } from '../model/Site';
import { PluginDataRepository } from '../repository/PluginDataRepository';
import { AppService } from './AppService';

export const token: InjectionKey<SiteService> = Symbol('siteService');
@singleton()
export class SiteService {
  private readonly pluginDataRepository = new PluginDataRepository();
  private readonly appService = container.resolve(AppService);
  readonly site: Ref<Site | null> = ref(null);
  readonly themes: Ref<Theme[]> = shallowRef([]);
  readonly themeConfig: Ref<Theme | null> = shallowRef(null);

  constructor() {
    this.init();
  }

  private async init() {
    this.themes.value = await this.pluginDataRepository.getThemes();
    this.site.value = {
      ...DEFAULT_SITE,
      ...(await this.pluginDataRepository.getSite()),
    };

    const { themeName } = this.site.value;
    await this.loadTheme(themeName).catch(noop);
  }

  private readonly initializedThemeNames = new Set();
  private initCustomValues(themeConfig: Theme) {
    const themeName = themeConfig.name;

    if (!themeConfig.siteFields || this.initializedThemeNames.has(themeName)) {
      return;
    }

    if (!this.site.value) {
      throw new Error('no site info');
    }

    const defaultCustom = {};

    for (const field of themeConfig.siteFields) {
      set(defaultCustom, field.name, undefined);
    }

    defaults(this.site.value.custom[themeName], defaultCustom);
    this.initializedThemeNames.add(themeName);
  }

  async loadTheme(themeName: string) {
    if (!this.site.value) {
      throw new Error('site is not ready when load theme');
    }

    if (themeName === this.themeConfig.value?.name) {
      return;
    }

    try {
      this.themeConfig.value = await this.pluginDataRepository.getTheme(themeName);
      this.initCustomValues(this.themeConfig.value);
    } catch (error) {
      if (!this.themeConfig.value) {
        this.themeConfig.value = await this.pluginDataRepository.getTheme(DEFAULT_THEME_NAME);
      }

      this.appService.openModal({
        type: 'error',
        title: 'Fail to load theme',
        content: (error as Error).message,
      });
      throw error;
    }
  }

  async saveSite(site?: Partial<Site>) {
    const siteData = mergeWith(this.site.value, site, (objValue, sourceValue) => {
      if (isTypedArray(sourceValue)) {
        return sourceValue;
      }
    });
    await this.pluginDataRepository.saveSite(toRaw(siteData));
  }
}
