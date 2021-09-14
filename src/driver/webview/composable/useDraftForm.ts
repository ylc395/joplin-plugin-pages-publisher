import { Form } from 'ant-design-vue';
import {
  every,
  isEqualWith,
  IsEqualCustomizer,
  isEmpty,
  cloneDeepWith,
  isTypedArray,
  isUndefined,
  defaultsDeep,
  has,
  set,
} from 'lodash';
import { Ref, computed, ref, watchEffect } from 'vue';
import { isUnset } from '../utils';

type Data = Record<string, unknown>;
type Rules = Record<string, unknown>;

const customClone = (value: unknown) => {
  if (isTypedArray(value)) {
    return null;
  }
};

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

  const modelRef: Ref<Partial<T>> = ref({});
  watchEffect(() => {
    if (origin.value) {
      modelRef.value = defaultsDeep(modelRef.value, cloneDeepWith(origin.value, customClone));
    }
  });

  const rules_ = typeof rules === 'function' ? computed(() => rules(modelRef.value)) : rules;

  // todo: if ant-design-vue support validating non-existed props, following code can be removed
  if (rules_) {
    watchEffect(() => {
      if (!origin.value) {
        return;
      }

      for (const name of Object.keys(rules_.value)) {
        if (!has(modelRef.value, name)) {
          set(modelRef.value, name, null);
        }
      }
    });
  }

  const { validateInfos, validate } = Form.useForm(modelRef, rules_, {
    validateOnRuleChange: true,
    immediate: true,
  });

  // todo: first validating doesn't work. see https://github.com/vueComponent/ant-design-vue/pull/4646/
  // when merged, remove following code
  let validated = false;
  const stopValidate = watchEffect(() => {
    if (validated) {
      stopValidate();
      return;
    }

    if (!isEmpty(modelRef.value)) {
      validated = true;
      validate();
    }
  });

  const save = async () => {
    await validate();
    await saveFunc(modelRef.value);
  };

  const isModified = computed(() => !isEqualWith(modelRef.value, origin.value, customEqual_));
  const isValid = computed(() => every(validateInfos, { validateStatus: 'success' }));
  const canSave = computed(() => isModified.value && !isEmpty(modelRef.value) && isValid.value);

  return { save, canSave, modelRef, validateInfos, isModified, isValid };
}
