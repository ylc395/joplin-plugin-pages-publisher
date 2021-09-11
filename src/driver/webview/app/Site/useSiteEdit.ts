import { computed, Ref, watch, inject, watchEffect } from 'vue';
import { pick, mapKeys, cloneDeep, every, constant, isEqualWith } from 'lodash';
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

export function useWatchSelectTheme(siteModelRef: Ref<Partial<Site>>) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { loadTheme, site } = inject(siteToken)!;
  let doNotRun = false;

  watch(
    () => siteModelRef.value.themeName,
    (themeName, oldThemeName) => {
      if (!themeName) {
        return;
      }

      if (doNotRun) {
        doNotRun = false;
        return;
      }
      const isModified = !isEqualWith(site.value, siteModelRef.value, (_1, _2, key) =>
        key === 'themeName' ? true : undefined,
      );

      if (isModified) {
        Modal.confirm({
          content: constant(
            'Change a theme will drop all your modification that has not been save. Continue to change?',
          ),
          onOk: () => loadTheme(themeName),
          onCancel: () => {
            siteModelRef.value.themeName = oldThemeName;
            doNotRun = true;
            return Promise.resolve();
          },
        });
      } else {
        loadTheme(themeName);
      }
    },
  );
}
