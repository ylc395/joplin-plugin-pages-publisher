<script lang="ts">
import { defineComponent, inject, provide } from 'vue';
import { Form, Select, Button, InputNumber, Switch } from 'ant-design-vue';
import { token as siteToken } from '../../../../domain/service/SiteService';
import { useDraftForm } from '../../composable/useDraftForm';
import FieldForm from '../../components/FieldForm/index.vue';
import { token as formToken } from '../../components/FieldForm/useFieldForm';
import { useSiteEdit, useCustomFieldModel, useCustomFieldValidateInfo } from './useSiteEdit';

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
    const { site, themes, saveSite, loadTheme } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(siteToken)!;

    const { hasThemeFields, customFieldRules, customFields } = useSiteEdit();

    const { modelRef, validateInfos, save, canSave } = useDraftForm(site, saveSite, (data) => ({
      name: [{ required: true }],
      themeName: [{ required: true }],
      feedLength: [{ required: data.feedEnabled }],
      ...customFieldRules.value,
    }));

    provide(formToken, {
      model: useCustomFieldModel(modelRef),
      validateInfos: useCustomFieldValidateInfo(customFieldRules, validateInfos),
      fields: customFields,
    });

    return {
      themes,
      loadTheme,
      validateInfos,
      modelRef,
      save,
      canSave,
      hasThemeFields,
    };
  },
});
</script>
<template>
  <div class="px-6">
    <Form :labelCol="{ span: 4 }">
      <FormItem label="Theme" v-bind="validateInfos.themeName">
        <Select v-model:value="modelRef.themeName" @change="loadTheme">
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
    <FieldForm v-if="hasThemeFields" class="mt-10" />
    <div class="text-right">
      <Button type="primary" :disabled="!canSave" @click="save">Save</Button>
    </div>
  </div>
</template>
