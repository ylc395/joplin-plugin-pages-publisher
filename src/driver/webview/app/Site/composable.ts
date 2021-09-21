import { computed, Ref, watch, inject, watchEffect, ref } from 'vue';
import type { validateInfos } from 'ant-design-vue/lib/form/useForm';
import { Modal } from 'ant-design-vue';
import {
  pick,
  mapKeys,
  cloneDeep,
  isEqual,
  pickBy,
  negate,
  isEqualWith,
  omitBy,
  isEmpty,
  IsEqualCustomizer,
} from 'lodash';
import { token as siteToken } from 'domain/service/SiteService';
import { token as appToken, FORBIDDEN } from 'domain/service/AppService';
import type { Site } from 'domain/model/Site';
import { isUnset } from '../../utils';

export function useSiteEdit() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { themeConfig } = inject(siteToken)!;
  const customFields = computed(() => {
    return themeConfig.value?.siteFields ?? [];
  });
  const customFieldRules = computed(() => {
    const themeName = themeConfig.value?.name;

    if (!themeName) {
      return {};
    }

    return customFields.value.reduce((result, field) => {
      if (field.rules) {
        result[`custom.${themeName}.${field.name}`] = field.rules;
      }

      return result;
    }, {} as Record<string, unknown>);
  });

  const customEqual: IsEqualCustomizer = (_1, _2, key, _3, _4, stack) => {
    if (key === 'custom' && stack?.size === 2) {
      return isEqualWith(omitBy(_1, isEmpty), omitBy(_2, isEmpty), (__1, __2) => {
        if (isUnset(__1) && isUnset(__2)) {
          return true;
        }
      });
    }
  };
  return {
    customFieldRules,
    customFields,
    customEqual,
  };
}

export function useCustomFieldModel(siteModelRef: Ref<Partial<Site>>) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { site, themeConfig } = inject(siteToken)!;
  watch(themeConfig, (theme, oldTheme) => {
    if (!oldTheme) {
      return;
    }

    if (!site.value || !siteModelRef.value.custom) {
      throw new Error('no site or theme');
    }

    // discard all modification of draft after themeConfig changed
    siteModelRef.value.custom[oldTheme.name] = cloneDeep(site.value.custom[oldTheme.name]) ?? {};
  });

  return computed(() => {
    const themeName = themeConfig.value?.name;

    if (!themeName) {
      return {};
    }

    if (!siteModelRef.value.custom) {
      throw new Error('no custom values in site');
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

export function useAppWarning(isModified: Ref<boolean>, isValid: Ref<boolean>) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { setWarning } = inject(appToken)!;
  const MODIFICATION_WARNING = 'Site modification has not been saved.';
  const INVALID_WARNING = 'Site field(s) has not been filled correctly.';

  // todo: make invalid waring precede
  watch(isModified, () => {
    setWarning(FORBIDDEN.GENERATE, MODIFICATION_WARNING, isModified.value);
    setWarning(FORBIDDEN.TAB_SWITCH, MODIFICATION_WARNING, isModified.value);
  });

  watch(isValid, () => {
    setWarning(FORBIDDEN.GENERATE, INVALID_WARNING, !isValid.value);
    setWarning(FORBIDDEN.TAB_SWITCH, INVALID_WARNING, !isValid.value);
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
    if (themeName === siteModelRef.value.themeName) {
      return;
    }

    if (!site.value?.custom || !siteModelRef.value.custom) {
      throw new Error('no custom fields');
    }

    const currentThemeName = siteModelRef.value.themeName;

    if (!currentThemeName) {
      throw new Error('no current theme name');
    }

    const isModified = !isEqual(
      pickBy(site.value.custom[currentThemeName], negate(isUnset)),
      pickBy(siteModelRef.value.custom[currentThemeName], negate(isUnset)),
    );

    const onSuccess = async () => {
      selectedThemeName.value = themeName;

      try {
        await loadTheme(themeName);
        siteModelRef.value.themeName = themeName;
      } catch {
        selectedThemeName.value = currentThemeName;
      }
    };

    if (isModified) {
      Modal.confirm({
        content:
          'Change a theme will drop all your modification on theme fields that has not been saved. Continue to change?',
        onOk: onSuccess,
      });
    } else {
      onSuccess();
    }
  };

  return { handleSelect, selectedThemeName };
}
