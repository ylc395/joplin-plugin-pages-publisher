import { inject, InjectionKey, Ref } from 'vue';
import type { validateInfos } from 'ant-design-vue/lib/form/useForm';
import type { Field } from '../../../../domain/model/Page';

interface FormData {
  readonly model: Ref<Record<string, unknown>>;
  readonly fields: Ref<Readonly<Field[]>>;
  readonly validateInfos: Ref<validateInfos>;
}

export const token: InjectionKey<FormData> = Symbol();

export function useFieldForm() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { fields, model, validateInfos } = inject(token)!;

  for (const { name, defaultValue } of fields.value) {
    model.value[name] = model.value[name] ?? defaultValue;
  }

  return { fields, model, validateInfos };
}
