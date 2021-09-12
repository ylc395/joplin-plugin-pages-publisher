import { Form } from 'ant-design-vue';
import {
  every,
  isEqualWith,
  IsEqualCustomizer,
  isEmpty,
  cloneDeepWith,
  isTypedArray,
  isUndefined,
  isNil,
} from 'lodash';
import { Ref, computed, reactive, toRaw } from 'vue';

type Data = Record<string, unknown>;
type Rules = Record<string, unknown>;

const customClone = (value: unknown) => {
  if (isTypedArray(value)) {
    return null;
  }
};

const isUnset = (value: unknown) => isNil(value) || value === '';

export function useDraftForm<T = Data>(
  origin: Ref<T | null>,
  saveFunc: (model: Partial<T>) => Promise<void>,
  rules?: Ref<Rules> | ((modelRef: Partial<T>) => Rules),
  customEqual?: IsEqualCustomizer,
) {
  const customEqual_: IsEqualCustomizer = (...args) => {
    if (customEqual) {
      const result = customEqual(...args);
      if (!isUndefined(result)) {
        return result;
      }
    }

    if (isUnset(args[0]) && isUnset(args[1])) {
      return true;
    }
  };

  const modelRef = computed(() => {
    return (
      origin.value ? reactive(toRaw(cloneDeepWith(origin.value, customClone))) : reactive({})
    ) as Partial<T>;
  });

  const rules_ = typeof rules === 'function' ? computed(() => rules(modelRef.value)) : rules;
  const { validateInfos, validate } = Form.useForm(modelRef, rules_, {
    validateOnRuleChange: true,
    immediate: true,
  });

  const save = async () => {
    await validate();
    await saveFunc(modelRef.value);
  };

  const isModified = computed(() => !isEqualWith(modelRef.value, origin.value, customEqual_));
  const canSave = computed(() => {
    return (
      isModified.value &&
      !isEmpty(modelRef.value) &&
      every(validateInfos, { validateStatus: 'success' })
    );
  });

  return { save, canSave, modelRef, validateInfos, isModified };
}
