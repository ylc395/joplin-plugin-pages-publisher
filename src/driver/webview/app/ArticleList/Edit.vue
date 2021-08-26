<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Form, Select, Input, DatePicker, Button, Alert, Image, Spin } from 'ant-design-vue';
import { token as editToken } from './useEdit';
import { useDraftForm } from '../../composable/useDraftForm';

export default defineComponent({
  components: {
    Form,
    FormItem: Form.Item,
    Select,
    SelectOption: Select.Option,
    Input,
    Textarea: Input.TextArea,
    DatePicker,
    Button,
    Alert,
    Image,
    Spin,
  },
  setup() {
    const { article, stopEditing, saveArticle, isValidUrl, images } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(editToken)!;
    const { modelRef, canSave, save, validateInfos } = useDraftForm(
      article,
      saveArticle,
      (data) => ({
        url: [
          { required: true },
          {
            validator: (rule: unknown, value: string) =>
              isValidUrl(value, data.noteId) ? Promise.resolve() : Promise.reject('duplicated url'),
          },
        ],
        title: [{ required: true }],
        content: [{ required: true }],
        createdAt: [{ required: true }],
        updatedAt: [{ required: true }],
      }),
    );

    return {
      modelRef,
      validateInfos,
      article,
      images,
      save,
      stopEditing,
      canSave,
    };
  },
});
</script>
<template>
  <div>
    <Alert
      type="info"
      showIcon
      message="Any modification here won't affect origin note."
      class="mb-4"
    />
    <Spin :spinning="!article" tip="Loading article and its resources...">
      <Form v-if="modelRef" :labelCol="{ span: 6 }">
        <FormItem label="Url" v-bind="validateInfos.url">
          <Input v-model:value="modelRef.url" />
        </FormItem>
        <FormItem label="Title" v-bind="validateInfos.title">
          <Input v-model:value="modelRef.title" />
        </FormItem>
        <FormItem label="Content" v-bind="validateInfos.content">
          <Textarea v-model:value="modelRef.content" :rows="10" showCount />
        </FormItem>
        <FormItem label="Created At" v-bind="validateInfos.createdAt">
          <DatePicker v-model:value="modelRef.createdAt" showTime :allowClear="false" />
        </FormItem>
        <FormItem label="Updated At" v-bind="validateInfos.updatedAt">
          <DatePicker v-model:value="modelRef.updatedAt" showTime :allowClear="false" />
        </FormItem>
        <FormItem label="Tags">
          <Select v-model:value="modelRef.tags" mode="tags">
            <template v-if="article && article.tags">
              <SelectOption v-for="tag of article.tags" :key="tag">{{ tag }}</SelectOption>
            </template>
          </Select>
        </FormItem>
        <FormItem label="Cover Image">
          <Select v-model:value="modelRef.coverImg" optionLabelProp="value">
            <SelectOption v-for="img of images" :key="img.name">
              <Image width="50px" height="50px" :src="img.url" @click.stop />
              {{ img.name }}
            </SelectOption>
          </Select>
        </FormItem>
      </Form>
    </Spin>
    <div class="text-right">
      <Button type="primary" class="mr-2" :disabled="!canSave" @click="save">Save</Button>
      <Button @click="stopEditing">Cancel</Button>
    </div>
  </div>
</template>
