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
  noop,
} from 'lodash';
import { Ref, computed, ref, watchEffect, nextTick, watch } from 'vue';
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

  const draftModel: Ref<Partial<T>> = ref({});
  watchEffect(() => {
    if (origin.value) {
      defaultsDeep(draftModel.value, cloneDeepWith(origin.value, customClone));
    }
  });

  const rules_ = typeof rules === 'function' ? computed(() => rules(draftModel.value)) : rules;

  // todo: if ant-design-vue support validating non-existed props, following code can be removed
  if (rules_) {
    watchEffect(() => {
      if (!origin.value) {
        return;
      }

      for (const name of Object.keys(rules_.value)) {
        if (!has(draftModel.value, name)) {
          set(draftModel.value, name, null);
        }
      }
    });
  }

  const {
    validateInfos,
    validate,
    resetFields: _resetFields,
  } = Form.useForm(draftModel, rules_, {
    validateOnRuleChange: true,
    immediate: true,
  });

  const resetFields = () => {
    _resetFields(cloneDeepWith(origin.value, customClone) || undefined);
    nextTick(() => validate().catch(noop));
  };

  // todo: first validating doesn't work. see https://github.com/vueComponent/ant-design-vue/pull/4646/
  // when merged, remove following code
  let validated = false;
  const stopValidate = watchEffect(() => {
    if (validated) {
      stopValidate();
      return;
    }

    if (!isEmpty(draftModel.value)) {
      validated = true;
      validate();
    }
  });

  const save = async () => {
    await validate();
    await saveFunc(draftModel.value);
  };

  const isModified = ref(false);
  watch(
    [draftModel, origin],
    () => {
      isModified.value = !isEqualWith(draftModel.value, origin.value, customEqual_);
    },
    { immediate: true, deep: true },
  );

  const isValid = computed(() => every(validateInfos, { validateStatus: 'success' }));
  const canSave = computed(() => isModified.value && !isEmpty(draftModel.value) && isValid.value);

  return { save, canSave, modelRef: draftModel, validateInfos, isModified, isValid, resetFields };
}
