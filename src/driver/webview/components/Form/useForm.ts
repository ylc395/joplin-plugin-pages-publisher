import type { Field } from '../../../../domain/model/Page';
import type { InjectionKey, Ref } from 'vue';
import type { validateInfos } from 'ant-design-vue/lib/form/useForm';

interface FormData {
  readonly model: Ref<Record<string, unknown>>;
  readonly fields: Ref<Readonly<Field[]>>;
  readonly validateInfos: validateInfos;
}

export const token: InjectionKey<FormData> = Symbol();
