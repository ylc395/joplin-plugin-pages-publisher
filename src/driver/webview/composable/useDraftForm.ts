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
  isFunction,
} from 'lodash';
import { Ref, computed, ref, nextTick, watch, readonly } from 'vue';
import { isUnset } from '../utils';

type Data = Record<string, unknown>;
type Rules = Record<string, unknown>;

const customClone = (value: unknown) => {
  if (isTypedArray(value)) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return readonly(value as object);
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
  const isModified = ref(false);

  watch(
    origin,
    () => {
      // todo: value of type TypedArray shouldn't be copy
      defaultsDeep(draftModel.value, cloneDeepWith(origin.value, customClone));
    },
    { immediate: true, deep: true },
  );

  watch(
    [draftModel, origin],
    () => {
      isModified.value = !isEqualWith(draftModel.value, origin.value, customEqual_);
    },
    { immediate: true, deep: true },
  );

  const rules_ = isFunction(rules) ? computed(() => rules(draftModel.value)) : rules;

  // todo: if ant-design-vue support validating non-existed props, following code can be removed
  // https://github.com/vueComponent/ant-design-vue/pull/4647
  if (rules_) {
    watch(
      rules_,
      () => {
        if (!origin.value) {
          return;
        }

        for (const name of Object.keys(rules_.value)) {
          if (!has(draftModel.value, name)) {
            set(draftModel.value, name, null);
          }
        }
      },
      { immediate: true },
    );
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

  const save = async () => {
    await validate();
    await saveFunc(draftModel.value);
  };

  const isValid = computed(() => every(validateInfos, { validateStatus: 'success' }));
  const canSave = computed(() => isModified.value && !isEmpty(draftModel.value) && isValid.value);

  return { save, canSave, modelRef: draftModel, validateInfos, isModified, isValid, resetFields };
}
