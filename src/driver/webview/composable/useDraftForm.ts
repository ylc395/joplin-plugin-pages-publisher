import { Form } from 'ant-design-vue';
import { cloneDeep, every, isEqual, identity, isEmpty } from 'lodash';
import { Ref, computed, reactive, watchEffect } from 'vue';

type Data = Record<string, unknown>;
type Rules = Record<string, unknown>;

export function useDraftForm(
  model: Ref<Data | null>,
  rules: Ref<Rules> | ((modelRef: Data) => Rules),
  saveFunc: (model: Data) => Promise<Data | void>,
  transformer: (model: Data) => Data = identity,
) {
  let origin: null | Data = null;
  watchEffect(() => {
    origin = model.value ? transformer(model.value) : null;
  });

  const modelRef = computed(() => {
    return (model.value ? reactive(cloneDeep(transformer(model.value))) : {}) as Data;
  });

  const { validateInfos, validate } = Form.useForm(
    modelRef,
    typeof rules === 'function' ? computed(() => rules(modelRef.value)) : rules,
  );

  const save = async () => {
    await validate();
    const result = await saveFunc(modelRef.value);
    origin = result || modelRef.value;
  };

  const canSave = computed(() => {
    return (
      !isEmpty(modelRef.value) &&
      every(validateInfos, { validateStatus: 'success' }) &&
      !isEqual(modelRef.value, origin)
    );
  });

  return { save, canSave, modelRef, validateInfos };
}
