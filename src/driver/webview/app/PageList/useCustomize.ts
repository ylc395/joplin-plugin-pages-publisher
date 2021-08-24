import { computed, inject, InjectionKey, provide, Ref, ref, shallowRef } from 'vue';
import { Page, Vars } from '../../../../domain/model/Page';
import { token as pageToken } from '../../../../domain/service/PageService';

export const token: InjectionKey<ReturnType<typeof useCustomize>> = Symbol();
export function useCustomize() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { savePage } = inject(pageToken)!;
  const isCustomizing = ref(false);
  const page: Ref<null | Page> = shallowRef(null);
  const fields = computed(() => page.value?.fields.value || []);
  const filedVars: Ref<null | Vars> = ref(null);
  const rules = computed(() => {
    return fields.value.reduce((result, field) => {
      if (field.rules) {
        result[field.name] = field.rules;
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

  const service = {
    savePage,
    isCustomizing,
    page,
    customize,
    fields,
    filedVars,
    stopCustomize,
    rules,
  };

  provide(token, service);

  return service;
}
