import { computed, inject, InjectionKey, provide, Ref, ref, shallowRef } from 'vue';
import { Page, Vars } from 'domain/model/Page';
import { token as pageToken } from 'domain/service/PageService';

export const token: InjectionKey<ReturnType<typeof useCustomize>> = Symbol();
export function useCustomize() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { savePage, isValidUrl } = inject(pageToken)!;
  const isCustomizing = ref(false);
  const page: Ref<null | Page> = shallowRef(null);
  const fields = computed(() => page.value?.fields || []);
  const filedVars: Ref<null | Vars> = ref(null);
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
    filedVars.value = _page.fieldVars;
  };

  const stopCustomize = () => {
    isCustomizing.value = false;
    page.value = null;
    filedVars.value = null;
  };

  const save = async (data: Vars) => {
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
    filedVars,
    stopCustomize,
    rules,
  };

  provide(token, service);

  return service;
}
