import { computed, Ref, watch, inject, watchEffect } from 'vue';
import { pick, mapKeys, cloneDeep, isEqual, every } from 'lodash';
import { token as siteToken } from '../../../../domain/service/SiteService';
import { token as appToken } from '../../../../domain/service/AppService';
import type { Site } from '../../../../domain/model/Site';
import type { validateInfos } from 'ant-design-vue/lib/form/useForm';

export function useSiteEdit() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { themeConfig } = inject(siteToken)!;
  const hasThemeFields = computed(() => Boolean(themeConfig.value?.siteFields?.length));
  const customFields = computed(() => {
    const themeName = themeConfig.value?.name;

    if (!themeName) {
      return [];
    }

    return themeConfig.value?.siteFields ?? [];
  });
  const customFieldRules = computed(() => {
    const themeName = themeConfig.value?.name;

    if (!themeName) {
      return {};
    }

    return (themeConfig.value?.siteFields ?? []).reduce((result, field) => {
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

  return {
    hasThemeFields,
    customFieldRules,
    customFields,
  };
}

export function useCustomFieldModel(siteModelRef: Ref<Site>) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { site, themeConfig } = inject(siteToken)!;
  watch(themeConfig, (theme, oldTheme) => {
    if (!theme || !site.value) {
      throw new Error('no site or theme');
    }

    if (oldTheme) {
      siteModelRef.value.custom[theme.name] = cloneDeep(site.value.custom[theme.name]) ?? {};
      siteModelRef.value.custom[oldTheme.name] = cloneDeep(site.value.custom[oldTheme.name]) ?? {};
    }
  });

  return computed(() => {
    const themeName = themeConfig.value?.name;
    if (!themeName || !site.value) {
      return {};
    }

    return siteModelRef.value.custom[themeName] ?? {};
  });
}

export function useCustomFieldValidateInfo(
  rules: Ref<Record<string, unknown>>,
  validateInfos: validateInfos,
) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { themeConfig } = inject(siteToken)!;
  return computed(() => {
    const themeName = themeConfig.value?.name;

    if (!themeName) {
      return {};
    }

    const fieldNames = Object.keys(rules.value);

    return mapKeys(pick(validateInfos, fieldNames), (_, key) =>
      key.replace(new RegExp(`^custom\\.${themeName}\\.`), ''),
    );
  });
}

export function useBlockApp(siteModelRef: Ref<Site>, validateInfos: validateInfos) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { setBlockFlag } = inject(appToken)!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { site } = inject(siteToken)!;

  watchEffect(() => {
    const isModified = !isEqual(site.value, siteModelRef.value);
    const isValid = every(validateInfos, { validateStatus: 'success' });
    setBlockFlag(
      'siteConfig',
      (isModified && 'Site modification has not been saved') ||
        (!isValid && 'Not all filed is filled correctly'),
    );
  });
}
