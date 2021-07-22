<script lang="ts">
import { computed, defineComponent, inject, reactive } from 'vue';
import { Form, Select, Input, DatePicker, Button, Alert } from 'ant-design-vue';
import moment from 'moment';
import { cloneDeep, mapValues } from 'lodash';
import { token as editToken } from './useEdit';
import type { Article } from '../../../domain/model/Article';

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
  },
  setup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { article, stopEditing, saveArticle, isValidUrl } = inject(editToken)!;
    const modelRef = computed(() => {
      if (!article.value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as Record<string, any>;
      }

      return reactive(
        mapValues(cloneDeep(article.value), (value, key) => {
          if (['createdAt', 'updatedAt'].includes(key)) {
            return moment(value as number);
          }

          return value;
        }),
      );
    });

    const { validateInfos, validate } = Form.useForm(
      modelRef,
      reactive({
        url: [
          { required: true },
          {
            validator: (rule: unknown, value: string) =>
              isValidUrl(value, modelRef.value.noteId)
                ? Promise.resolve()
                : Promise.reject('duplicated url'),
          },
        ],
        title: [{ required: true }],
        content: [{ required: true }],
        createdAt: [{ required: true }],
        updatedAt: [{ required: true }],
      }),
    );
    const save = async () => {
      await validate();

      const article = mapValues(modelRef.value, (value) => {
        if (moment.isMoment(value)) {
          return Number(value.format('x'));
        }

        return value;
      }) as Partial<Article>;

      await saveArticle(article);
      stopEditing();
    };

    return { modelRef, validateInfos, article, save, stopEditing };
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
      <FormItem label="Tags" v-bind="validateInfos.tags">
        <Select v-model:value="modelRef.tags" mode="tags">
          <template v-if="article && article.tags">
            <SelectOption v-for="tag of article.tags" :key="tag">{{ tag }}</SelectOption>
          </template>
        </Select>
      </FormItem>
    </Form>
    <div class="text-right">
      <Button type="primary" class="mr-2" @click="save">Save</Button>
      <Button @click="stopEditing">Cancel</Button>
    </div>
  </div>
</template>
