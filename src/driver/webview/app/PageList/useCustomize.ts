import { computed, inject, InjectionKey, provide, Ref, ref, shallowRef } from 'vue';
import type { Page, PageValues } from 'domain/model/Page';
import { token as pageToken } from 'domain/service/PageService';

export const token: InjectionKey<ReturnType<typeof useCustomize>> = Symbol();
export function useCustomize() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { savePage, isValidUrl } = inject(pageToken)!;
  const isCustomizing = ref(false);
  const page: Ref<null | Page> = shallowRef(null);
  const fields = computed(() => page.value?.fields || []);
  const pageValues: Ref<null | PageValues> = ref(null);
  const rules = computed(() => {
    if (!page.value) {
      return {};
    }
    return fields.value.reduce((result, field) => {
      if (field.rules) {
        result[field.name] = field.rules;
      }

      if (field.name === 'url') {
        result[field.name] = [
          {
            validator: (rule: unknown, value: string) =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              !value || isValidUrl(value, page.value!.name)
                ? Promise.resolve()
                : Promise.reject('Invalid url'),
          },
        ];
      }

      return result;
    }, {} as Record<string, unknown>);
  });
  const customize = (_page: Page) => {
    isCustomizing.value = true;
    page.value = _page;
    pageValues.value = _page.values;
  };

  const stopCustomize = () => {
    isCustomizing.value = false;
    page.value = null;
    pageValues.value = null;
  };

  const save = async (data: PageValues) => {
    if (!page.value) {
      throw new Error('no page to save');
    }

    await savePage(page.value, data);
    stopCustomize();
  };

  const service = {
    savePage: save,
    isCustomizing,
    customize,
    fields,
    pageValues,
    stopCustomize,
    rules,
  };

  provide(token, service);

  return service;
}
