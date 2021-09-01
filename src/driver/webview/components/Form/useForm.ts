import type { Field } from '../../../../domain/model/Page';
import type { InjectionKey, Ref } from 'vue';
import type { validateInfos } from 'ant-design-vue/lib/form/useForm';

interface FormData {
  model: Ref<Record<string, unknown>>;
  fields: Ref<Field[]>;
  validateInfos: validateInfos;
}

export const token: InjectionKey<FormData> = Symbol();
