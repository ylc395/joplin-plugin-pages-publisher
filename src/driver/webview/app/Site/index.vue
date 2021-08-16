<script lang="ts">
import { defineComponent, inject, Ref } from 'vue';
import { Form, Input, Select, Button, InputNumber } from 'ant-design-vue';
import { token } from '../../../../domain/service/SiteService';
import { pick } from 'lodash';
import { useDraftForm } from '../../composable/useDraftForm';

export default defineComponent({
  components: {
    Form,
    FormItem: Form.Item,
    Input,
    Select,
    SelectOption: Select.Option,
    Button,
    InputNumber,
    Textarea: Input.TextArea,
  },
  setup() {
    const fields = [
      'name',
      'description',
      'language',
      'themeName',
      'RSSMode',
      'RSSLength',
      'footer',
    ] as const;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { site, themes, saveSite } = inject(token)!;
    const { modelRef, validateInfos, save, canSave } = useDraftForm(
      site as Ref<Record<string, unknown> | null>,
      (data) => ({
        name: [{ required: true }],
        themeName: [{ required: true }],
        RSSLength: [{ required: data.RSSMode !== 'none' }],
      }),
      async (data) => {
        await saveSite(data);
        return data;
      },
      (model) => pick(model, fields),
    );

    return {
      themes,
      validateInfos,
      modelRef,
      save,
      canSave,
    };
  },
});
</script>
<template>
  <div class="px-6">
    <Form :labelCol="{ span: 4 }">
      <FormItem label="Site Name" v-bind="validateInfos.name">
        <Input v-model:value="modelRef.name" />
      </FormItem>
      <FormItem label="Site Description">
        <Input v-model:value="modelRef.description" />
      </FormItem>
      <FormItem label="Site Language">
        <Input v-model:value="modelRef.language" />
      </FormItem>
      <FormItem label="Theme" v-bind="validateInfos.themeName">
        <Select v-model:value="modelRef.themeName">
          <SelectOption v-for="{ name } of themes" :key="name">{{ name }}</SelectOption>
        </Select>
      </FormItem>
      <FormItem label="RSS">
        <Select v-model:value="modelRef.RSSMode">
          <SelectOption value="none"> No RSS </SelectOption>
          <SelectOption value="abstract"> Only Digest </SelectOption>
          <SelectOption value="full"> Full Content </SelectOption>
        </Select>
      </FormItem>
      <FormItem v-if="modelRef.RSSMode !== 'none'" label="RSS Length">
        <InputNumber v-model:value="modelRef.RSSLength" :min="1" />
      </FormItem>
      <FormItem label="Footer">
        <Textarea v-model:value="modelRef.footer" />
      </FormItem>
    </Form>
    <div class="buttons">
      <Button type="primary" :disabled="!canSave" @click="save">Save</Button>
    </div>
  </div>
</template>
<style scoped>
.buttons {
  display: flex;
  justify-content: flex-end;
}
</style>
