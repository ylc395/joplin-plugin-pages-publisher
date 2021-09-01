<script lang="ts">
import { computed, defineComponent, inject, provide } from 'vue';
import { Form, Select, Button, InputNumber } from 'ant-design-vue';
import { token as siteToken } from '../../../../domain/service/SiteService';
import { useDraftForm } from '../../composable/useDraftForm';
import FieldForm from '../../components/Form/index.vue';
import { token as formToken } from '../../components/Form/useForm';

export default defineComponent({
  components: {
    Form,
    FormItem: Form.Item,
    Select,
    SelectOption: Select.Option,
    Button,
    InputNumber,
    FieldForm,
  },
  setup() {
    const {
      site,
      themes,
      saveSite,
      loadTheme,
      themeConfig,
      siteFieldValues,
      siteFieldRules,
      saveSiteValues,
    } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(siteToken)!;
    const {
      modelRef,
      validateInfos,
      save: _saveSite,
      canSave: canSaveSite,
    } = useDraftForm(site, saveSite, (data) => ({
      name: [{ required: true }],
      themeName: [{ required: true }],
      RSSLength: [{ required: data.RSSMode !== 'none' }],
    }));

    const {
      modelRef: fieldValues,
      validateInfos: fieldValidateInfos,
      save: _saveSiteValues,
      canSave: canSaveFieldValues,
    } = useDraftForm(siteFieldValues, saveSiteValues, siteFieldRules);

    const save = async () => {
      await _saveSite();
      await _saveSiteValues();
    };

    const canSave = computed(() => canSaveSite.value || canSaveFieldValues.value);
    const hasThemeFields = computed(() => Boolean(themeConfig.value?.siteFields?.length));

    provide(formToken, {
      model: fieldValues,
      validateInfos: fieldValidateInfos,
      fields: computed(() => themeConfig.value?.siteFields ?? []),
    });

    return {
      themes,
      loadTheme,
      canSaveFieldValues,
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
      <FormItem label="RSS">
        <Select v-model:value="modelRef.RSSMode">
          <SelectOption value="none"> No RSS </SelectOption>
          <SelectOption value="digest"> Only Digest </SelectOption>
          <SelectOption value="full"> Full Content </SelectOption>
        </Select>
      </FormItem>
      <FormItem v-if="modelRef.RSSMode !== 'none'" label="RSS Length">
        <InputNumber v-model:value="modelRef.RSSLength" :min="1" />
      </FormItem>
    </Form>
    <FieldForm v-if="hasThemeFields" class="mt-10" />
    <div class="text-right">
      <Button type="primary" :disabled="!canSave" @click="save">Save</Button>
    </div>
  </div>
</template>
