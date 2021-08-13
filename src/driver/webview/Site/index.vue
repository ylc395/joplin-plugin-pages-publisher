<script lang="ts">
import { computed, defineComponent, inject, reactive } from 'vue';
import { Form, Input, Select, Button, InputNumber } from 'ant-design-vue';
import { token } from '../../../domain/service/SiteService';
import { cloneDeep, every, isEqual, pick } from 'lodash';

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
    const modelRef = computed(() => {
      return (site.value ? reactive(cloneDeep(pick(site.value, fields))) : {}) as Record<
        string,
        unknown
      >;
    });

    const { validateInfos, validate } = Form.useForm(
      modelRef,
      computed(() => ({
        name: [{ required: true }],
        themeName: [{ required: true }],
        RSSLength: [{ required: modelRef.value.RSSMode !== 'none' }],
      })),
    );
    const save = async () => {
      await validate();
      saveSite(modelRef.value);
    };
    const canSave = computed(() => {
      const origin = pick(site.value, fields);
      return (
        every(validateInfos, { validateStatus: 'success' }) && !isEqual(modelRef.value, origin)
      );
    });

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
