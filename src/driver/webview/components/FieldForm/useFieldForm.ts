import { inject, InjectionKey, Ref, computed, unref } from 'vue';
import type { validateInfos } from 'ant-design-vue/lib/form/useForm';
import type { Field } from '../../../../domain/model/Page';

interface FormData {
  readonly model: Ref<Record<string, unknown>>;
  readonly fields: Ref<Readonly<Field[]>>;
  readonly validateInfos: Ref<validateInfos> | validateInfos;
}

export const token: InjectionKey<FormData> = Symbol();

export function useFieldForm() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { model, validateInfos, fields } = inject(token)!;

  return { model, fields, validateInfos: computed(() => unref(validateInfos)) };
}
