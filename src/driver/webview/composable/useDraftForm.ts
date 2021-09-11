import { Form } from 'ant-design-vue';
import { every, isEqual, isEmpty, cloneDeepWith, isTypedArray } from 'lodash';
import { Ref, computed, reactive, watchEffect, shallowRef, watch } from 'vue';

type Data = Record<string, unknown>;
type Rules = Record<string, unknown>;

const customClone = (value: unknown) => {
  if (isTypedArray(value)) {
    return null;
  }
};

export function useDraftForm<T = Data>(
  model: Ref<T | null>,
  saveFunc: (model: T) => Promise<T | void>,
  rules?: Ref<Rules> | ((modelRef: T) => Rules),
) {
  const origin: Ref<null | T> = shallowRef(null);

  watchEffect(() => {
    origin.value = model.value;
  });

  const modelRef = computed(() => {
    return (model.value ? reactive(cloneDeepWith(model.value as any, customClone)) : {}) as T;
  });

  const rules_ = typeof rules === 'function' ? computed(() => rules(modelRef.value)) : rules;
  const { validateInfos, validate } = Form.useForm(modelRef, rules_);

  if (rules_) {
    watch(rules_, async () => {
      try {
        await validate();
        // eslint-disable-next-line no-empty
      } catch {}
    });
  }

  const save = async () => {
    await validate();
    const result = await saveFunc(modelRef.value);
    origin.value = cloneDeepWith(result || model.value, customClone);
  };

  const isModified = computed(() => !isEqual(modelRef.value, origin.value));
  const canSave = computed(() => {
    return (
      !isEmpty(modelRef.value) &&
      every(validateInfos, { validateStatus: 'success' }) &&
      isModified.value
    );
  });

  return { save, canSave, modelRef, validateInfos, isModified };
}
