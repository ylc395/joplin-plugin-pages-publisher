import { computed, Ref, watch, inject } from 'vue';
import { pick, mapKeys, cloneDeep } from 'lodash';
import { token } from '../../../../domain/service/SiteService';
import type { Site } from '../../../../domain/model/Site';
import type { ValidateInfo } from 'ant-design-vue/lib/form/useForm';

export function useSiteEdit() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { themeConfig } = inject(token)!;
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
  const { site, themeConfig } = inject(token)!;
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
  validateInfos: ValidateInfo,
) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { themeConfig } = inject(token)!;
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
