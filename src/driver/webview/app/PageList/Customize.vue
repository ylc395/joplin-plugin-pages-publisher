<script lang="ts">
import { defineComponent, inject } from 'vue';
import {
  Form,
  Select,
  Switch,
  InputNumber,
  Radio,
  Checkbox,
  DatePicker,
  Input,
  Button,
} from 'ant-design-vue';
import { token as customizeToken } from './useCustomize';
import { useDraftForm } from '../../composable/useDraftForm';
import { mapValues, constant } from 'lodash';

export default defineComponent({
  components: {
    Button,
    Form,
    FormItem: Form.Item,
    Select,
    Textarea: Input.TextArea,
    Switch,
    InputNumber,
    RadioGroup: Radio.Group,
    CheckboxGroup: Checkbox.Group,
    DatePicker,
    Input,
  },
  setup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { fields, filedVars, savePage, page, stopCustomize } = inject(customizeToken)!;
    const { save, canSave, modelRef, validateInfos } = useDraftForm(
      filedVars,
      (data) => mapValues(data, constant([{ required: true }])),
      (data) => savePage(page, data),
    );

    return { save, canSave, modelRef, validateInfos, fields, stopCustomize };
  },
});
</script>

<template>
  <Form :labelCol="{ span: 4 }">
    <FormItem
      v-for="field of fields"
      :key="field.name"
      :label="field.label || field.name"
      v-bind="validateInfos[field.name]"
    >
      <Select
        v-if="['select', 'multiple-select'].includes(field.inputType || '')"
        v-model:value="modelRef[field.name]"
        :mode="field.inputType === 'multiple-select' ? 'multiple' : ''"
        :options="field.options"
      />
      <Textarea v-else-if="field.inputType === 'textarea'" v-model:value="modelRef[field.name]" />
      <Switch v-else-if="field.inputType === 'switch'" v-model:value="modelRef[field.name]" />
      <InputNumber v-else-if="field.inputType === 'number'" v-model:value="modelRef[field.name]" />
      <RadioGroup
        v-else-if="field.inputType === 'radio'"
        v-model:value="modelRef[field.name]"
        :options="field.options"
      />
      <CheckboxGroup
        v-else-if="field.inputType === 'checkbox'"
        v-model:value="modelRef[field.name]"
        :options="field.options"
      />
      <DatePicker v-else-if="field.inputType === 'date'" v-model:value="modelRef[field.name]" />
      <Input v-else v-model:value="modelRef[field.name]" />
    </FormItem>
  </Form>
  <div class="text-right">
    <Button type="primary" class="mr-2" :disabled="!canSave" @click="save">Save</Button>
    <Button @click="stopCustomize">Cancel</Button>
  </div>
</template>
