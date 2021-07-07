<script lang="ts">
import { computed, defineComponent, inject, reactive } from 'vue';
import { Form, Input, Select, Button } from 'ant-design-vue';
import { token } from '../../../domain/service/SiteService';
import { cloneDeep, every, isEqual } from 'lodash';

export default defineComponent({
  components: { Form, FormItem: Form.Item, Input, Select, SelectOption: Select.Option, Button },
  setup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { site, themes, saveSite } = inject(token)!;
    const { validateInfos, modelRef, validate } = Form.useForm(
      computed(() => {
        return site.value ? reactive(cloneDeep(site.value)) : {};
      }),
      reactive({
        name: [{ required: true }],
        themeName: [{ required: true }],
        articlePagePrefix: [{ required: true }],
        archivesPagePrefix: [{ required: true }],
        tagPagePrefix: [{ required: true }],
      }),
    );
    const save = async () => {
      try {
        await validate();
        saveSite(modelRef.value);
      } catch {
        return;
      }
    };
    const canSave = computed(() => {
      return (
        every(validateInfos, { validateStatus: 'success' }) && !isEqual(modelRef.value, site.value)
      );
    });

    return {
      themes,
      validateInfos,
      modelRef: computed(() => modelRef.value || {}),
      save,
      canSave,
    };
  },
});
</script>
<template>
  <div>
    <Form>
      <FormItem label="Site Name" v-bind="validateInfos.name">
        <Input v-model:value="modelRef.name" />
      </FormItem>
      <FormItem label="Site Description">
        <Input v-model:value="modelRef.description" />
      </FormItem>
      <FormItem label="Theme" v-bind="validateInfos.themeName">
        <Select v-model:value="modelRef.themeName">
          <SelectOption v-for="{ name } of themes" :key="name">{{ name }}</SelectOption>
        </Select>
      </FormItem>
      <FormItem label="Site Language">
        <Input v-model:value="modelRef.language" />
      </FormItem>
      <FormItem label="Article Pages Path" v-bind="validateInfos.articlePagePrefix">
        <Input v-model:value="modelRef.articlePagePrefix" />
      </FormItem>
      <FormItem label="Archives Pages Path" v-bind="validateInfos.archivesPagePrefix">
        <Input v-model:value="modelRef.archivesPagePrefix" />
      </FormItem>
      <FormItem label="Tag Pages Path" v-bind="validateInfos.tagPagePrefix">
        <Input v-model:value="modelRef.tagPagePrefix" />
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
