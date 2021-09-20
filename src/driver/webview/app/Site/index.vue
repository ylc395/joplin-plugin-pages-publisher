<script lang="ts">
import { defineComponent, inject, provide } from 'vue';
import { Form, Select, Button, InputNumber, Switch } from 'ant-design-vue';
import { token as siteToken } from '../../../../domain/service/SiteService';
import { useDraftForm } from '../../composable/useDraftForm';
import FieldForm from '../../components/FieldForm/index.vue';
import { token as formToken } from '../../components/FieldForm/useFieldForm';
import {
  useSiteEdit,
  useCustomFieldModel,
  useCustomFieldValidateInfo,
  useAppWarning,
  useSelectTheme,
} from './composable';

export default defineComponent({
  components: {
    Form,
    FormItem: Form.Item,
    Select,
    SelectOption: Select.Option,
    Switch,
    Button,
    InputNumber,
    FieldForm,
  },
  setup() {
    const { site, themes, saveSite } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(siteToken)!;

    const { customFieldRules, customFields } = useSiteEdit();

    const { modelRef, validateInfos, save, canSave, isModified, isValid, resetFields } =
      useDraftForm(site, saveSite, (data) => ({
        themeName: [{ required: true }],
        feedEnabled: [{ required: true }],
        feedLength: [{ required: data.feedEnabled }],
        ...customFieldRules.value,
      }));

    useAppWarning(isModified, isValid);
    const { handleSelect, selectedThemeName } = useSelectTheme(modelRef);

    provide(formToken, {
      model: useCustomFieldModel(modelRef),
      validateInfos: useCustomFieldValidateInfo(customFieldRules, validateInfos),
      fields: customFields,
    });

    return {
      themes,
      validateInfos,
      modelRef,
      save,
      canSave,
      customFields,
      handleSelect,
      selectedThemeName,
      isModified,
      resetFields,
    };
  },
});
</script>
<template>
  <div class="px-6">
    <h2 class="text-gray-400">General Configuration</h2>
    <Form :labelCol="{ span: 4 }">
      <FormItem label="Theme" v-bind="validateInfos.themeName">
        <Select :value="selectedThemeName" @change="handleSelect">
          <SelectOption v-for="{ name } of themes" :key="name">{{ name }}</SelectOption>
        </Select>
      </FormItem>
      <FormItem label="Feed">
        <Switch v-model:checked="modelRef.feedEnabled" />
      </FormItem>
      <FormItem v-if="modelRef.feedEnabled" label="Feed Length">
        <InputNumber v-model:value="modelRef.feedLength" :min="1" />
      </FormItem>
    </Form>
    <template v-if="customFields.length > 0" class="mt-10">
      <h2 class="text-gray-400">Theme customized Configuration</h2>
      <FieldForm />
    </template>
    <div class="text-right">
      <Button v-if="isModified" class="mr-3" @click="resetFields">Reset</Button>
      <Button type="primary" :disabled="!canSave" @click="save">Save</Button>
    </div>
  </div>
</template>
