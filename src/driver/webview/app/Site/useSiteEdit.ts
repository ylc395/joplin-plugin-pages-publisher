import { computed, Ref, watch, inject, watchEffect, ref } from 'vue';
import { pick, mapKeys, cloneDeep, every, constant, isEqual } from 'lodash';
import { token as siteToken } from '../../../../domain/service/SiteService';
import { token as appToken } from '../../../../domain/service/AppService';
import type { Site } from '../../../../domain/model/Site';
import type { validateInfos } from 'ant-design-vue/lib/form/useForm';
import { Modal } from 'ant-design-vue';

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

export function useCustomFieldModel(siteModelRef: Ref<Partial<Site>>) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { site, themeConfig } = inject(siteToken)!;
  watch(themeConfig, (theme, oldTheme) => {
    if (!theme || !site.value) {
      throw new Error('no site or theme');
    }

    if (!siteModelRef.value.custom) {
      return;
    }

    if (oldTheme) {
      siteModelRef.value.custom[theme.name] = cloneDeep(site.value.custom[theme.name]) ?? {};
      siteModelRef.value.custom[oldTheme.name] = cloneDeep(site.value.custom[oldTheme.name]) ?? {};
    }
  });

  return computed(() => {
    const themeName = themeConfig.value?.name;
    if (!themeName || !site.value || !siteModelRef.value.custom) {
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

export function useBlockApp(isModified: Ref<boolean>, validateInfos: validateInfos) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { setBlockFlag } = inject(appToken)!;

  watchEffect(() => {
    const isValid = every(validateInfos, { validateStatus: 'success' });
    setBlockFlag(
      'siteConfig',
      (isModified.value && 'Site modification has not been saved') ||
        (!isValid && 'Not all filed is filled correctly'),
    );
  });
}

export function useSelectTheme(siteModelRef: Ref<Partial<Site>>) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { loadTheme, site } = inject(siteToken)!;
  const selectedThemeName = ref('');

  const stopInitialize = watchEffect(() => {
    if (siteModelRef.value.themeName) {
      selectedThemeName.value = siteModelRef.value.themeName;
      stopInitialize();
    }
  });

  const handleSelect = (themeName: string) => {
    if (!site.value?.custom || !siteModelRef.value.custom) {
      throw new Error('no custom fields');
    }

    const currentThemeName = siteModelRef.value.themeName;

    if (!currentThemeName) {
      throw new Error('no current theme name');
    }

    const isModified = !isEqual(
      site.value.custom[currentThemeName],
      siteModelRef.value.custom[currentThemeName],
    );

    const onSuccess = () => {
      siteModelRef.value.themeName = themeName;
      return loadTheme(themeName);
    };

    if (isModified) {
      Modal.confirm({
        content: constant(
          'Change a theme will drop all your modification on theme fields that has not been saved. Continue to change?',
        ),
        onOk: onSuccess,
        onCancel: () => {
          selectedThemeName.value = currentThemeName;
          return Promise.resolve();
        },
      });
    } else {
      onSuccess();
    }
  };

  return { handleSelect, selectedThemeName };
}
