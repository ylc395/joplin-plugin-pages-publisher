<script lang="ts">
/* eslint-disable vue/no-v-html */
import { defineComponent } from 'vue';
import {
  Form,
  Select,
  Switch,
  InputNumber,
  Radio,
  Checkbox,
  DatePicker,
  Input,
} from 'ant-design-vue';
import _sanitizeHtml from 'sanitize-html';
import { useFieldForm, useLabelSpan } from './useFieldForm';

const sanitizeHtml = (html: string) =>
  _sanitizeHtml(html, {
    allowedTags: [
      'span',
      'a',
      'strong',
      'em',
      'b',
      'small',
      'abbr',
      'code',
      'time',
      'samp',
      'kdb',
      'ruby',
      'rt',
      'rp',
      'ins',
      'del',
    ],
    allowedAttributes: {
      '*': ['style', 'title'],
      a: ['href', 'target'],
    },
    allowedSchemes: ['http', 'https'],
    disallowedTagsMode: 'escape',
    transformTags: {
      a: _sanitizeHtml.simpleTransform('a', { target: '_blank' }),
    },
  });

export default defineComponent({
  components: {
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
    return {
      ...useFieldForm(),
      sanitizeHtml,
      labelSpan: useLabelSpan(),
    };
  },
});
</script>

<template>
  <Form :labelCol="{ span: labelSpan }">
    <FormItem
      v-for="field of fields"
      :key="field.name"
      :label="field.label || field.name"
      v-bind="validateInfos[field.name]"
    >
      <template v-if="field.tip" #extra>
        <span v-html="sanitizeHtml(field.tip)"></span>
      </template>
      <Select
        v-if="['select', 'multiple-select'].includes(field.inputType || '')"
        v-model:value="model[field.name]"
        :mode="field.inputType === 'multiple-select' ? 'multiple' : ''"
        :options="field.options"
        :placeholder="field.placeholder"
      />
      <Textarea
        v-else-if="field.inputType === 'textarea'"
        v-model:value="model[field.name]"
        :placeholder="field.placeholder"
      />
      <Switch v-else-if="field.inputType === 'switch'" v-model:value="model[field.name]" />
      <InputNumber v-else-if="field.inputType === 'number'" v-model:value="model[field.name]" />
      <RadioGroup
        v-else-if="field.inputType === 'radio'"
        v-model:value="model[field.name]"
        :options="field.options"
      />
      <CheckboxGroup
        v-else-if="field.inputType === 'checkbox'"
        v-model:value="model[field.name]"
        :options="field.options"
      />
      <DatePicker v-else-if="field.inputType === 'date'" v-model:value="model[field.name]" />
      <Input v-else v-model:value="model[field.name]" :placeholder="field.placeholder" />
    </FormItem>
  </Form>
</template>
