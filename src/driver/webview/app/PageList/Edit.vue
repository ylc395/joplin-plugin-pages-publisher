<template>
  <Form>
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
</template>
