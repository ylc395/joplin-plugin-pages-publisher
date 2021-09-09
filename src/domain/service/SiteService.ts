import { container, singleton } from 'tsyringe';
import { Ref, shallowRef, InjectionKey, computed, toRaw, reactive } from 'vue';
import { Theme, DEFAULT_THEME_NAME } from '../model/Theme';
import { Site, DEFAULT_SITE } from '../model/Site';
import { PluginDataRepository } from '../repository/PluginDataRepository';
import { ExceptionService } from './ExceptionService';
import { cloneDeep, mapKeys, pick } from 'lodash';

export const token: InjectionKey<SiteService> = Symbol('siteService');
@singleton()
export class SiteService {
  private readonly pluginDataRepository = new PluginDataRepository();
  private readonly exceptionService = container.resolve(ExceptionService);
  readonly site: Ref<Site | null> = shallowRef(null);
  readonly themes: Ref<Theme[]> = shallowRef([]);
  readonly themeConfig: Ref<Theme | null> = shallowRef(null);
  readonly customFieldRules = computed(() => {
    const themeName = this.themeConfig.value?.name;

    if (!themeName) {
      return {};
    }

    return (this.themeConfig.value?.siteFields ?? []).reduce((result, field) => {
      if (field.rules) {
        result[`custom.${themeName}.${field.name}`] = field.rules?.map((rule) =>
          rule.required
            ? { ...rule, message: rule.message || `${field.label || field.name} is Required` }
            : rule,
        );
      }

      return result;
    }, {} as Record<string, unknown>);
  });

  getCustomFieldValidateInfo(validateInfos: Record<string, any>) {
    return computed(() => {
      const themeName = this.themeConfig.value?.name;

      if (!themeName) {
        return {};
      }

      const fieldNames = Object.keys(this.customFieldRules.value);

      return mapKeys(pick(validateInfos, fieldNames), (_, key) =>
        key.replace(new RegExp(`^custom\\.${themeName}\\.`), ''),
      );
    });
  }

  readonly hasThemeFields = computed(() => Boolean(this.themeConfig.value?.siteFields?.length));
  readonly customFields = computed(() => {
    const themeName = this.themeConfig.value?.name;

    if (!themeName) {
      return [];
    }

    return this.themeConfig.value?.siteFields ?? [];
  });

  getCustomFieldModel(siteModelRef: Ref<Site>) {
    let firstThemeLoaded = false;
    return computed(() => {
      const themeName = this.themeConfig.value?.name;
      if (!themeName || !this.site.value) {
        return {};
      }

      if (firstThemeLoaded) {
        return (siteModelRef.value.custom[themeName] = reactive(
          cloneDeep(this.site.value.custom[themeName] ?? {}),
        ));
      }

      firstThemeLoaded = true;
      return siteModelRef.value.custom[themeName] ?? {};
    });
  }

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

    if (!this.site.value.custom[themeName]) {
      this.site.value.custom[themeName] = {};
    }

    await this.loadTheme(themeName);
  }

  async loadTheme(themeName: string) {
    if (!this.site.value) {
      throw new Error('site is not ready when load theme');
    }

    try {
      this.themeConfig.value = await this.pluginDataRepository.getTheme(themeName);
      if (!this.site.value.custom[themeName]) {
        this.site.value.custom[themeName] = {};
      }
    } catch (error) {
      this.themeConfig.value =
        this.themeConfig.value || (await this.pluginDataRepository.getTheme(DEFAULT_THEME_NAME));
      this.exceptionService.reportError(error as Error, { title: 'Fail to load theme' });
    }
  }

  async saveSite(site?: Partial<Site>) {
    const siteData = Object.assign(this.site.value, toRaw(site));
    await this.pluginDataRepository.saveSite(siteData);
  }
}
