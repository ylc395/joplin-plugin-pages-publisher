<script lang="ts">
import { defineComponent, PropType, Ref, watch, ref, inject, computed } from 'vue';
import { Input, AutoComplete, Button, Select } from 'ant-design-vue';
import { BuildOutlined, ContainerOutlined } from '@ant-design/icons-vue';
import { PlusOutlined, UpOutlined, DownOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { cloneDeep, reject } from 'lodash';
import { ARTICLE_PAGE_NAME, Menu } from 'domain/model/Page';
import { token as articleToken } from 'domain/service/ArticleService';
import { token as pageToken } from 'domain/service/PageService';

export default defineComponent({
  components: {
    Input,
    AutoComplete,
    Button,
    PlusOutlined,
    UpOutlined,
    DownOutlined,
    DeleteOutlined,
    SelectOption: Select.Option,
    BuildOutlined,
    ContainerOutlined,
  },
  props: {
    value: {
      type: [Array, null] as PropType<Menu | null>,
      required: true,
    },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const menu: Ref<Menu> = ref([]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { articles } = inject(articleToken)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { pages } = inject(pageToken)!;

    const options = computed(() => {
      return [
        ...reject(
          pages.value.map(({ name, readableName }) => ({
            label: readableName,
            value: name,
            type: 'page',
          })),
          { value: ARTICLE_PAGE_NAME },
        ),
        ...articles.map(({ noteId, title }) => ({ label: title, value: noteId, type: 'article' })),
      ];
    });
    const add = () => menu.value.push({ label: '', link: '' });
    const moveUp = (index: number) =>
      ([menu.value[index - 1], menu.value[index]] = [menu.value[index], menu.value[index - 1]]);
    const moveDown = (index: number) =>
      ([menu.value[index + 1], menu.value[index]] = [menu.value[index], menu.value[index + 1]]);
    const remove = (index: number) => menu.value.splice(index, 1);

    watch(
      () => props.value,
      (value) => {
        if (value !== menu.value) {
          menu.value = cloneDeep(value) || [];
        }
      },
      { immediate: true },
    );

    watch(menu, () => emit('update:value', menu.value), { deep: true });

    return {
      options,
      menu,
      add,
      moveUp,
      moveDown,
      remove,
    };
  },
});
</script>
<template>
  <div v-for="(item, index) of menu" :key="index" class="flex flex-row mb-2 items-center">
    <Input v-model:value="item.label" class="w-28 mr-2" placeholder="Menu item label" />
    <AutoComplete
      v-model:value="item.link"
      class="w-52 mr-4"
      placeholder="Input a url or select a target page for menu item"
      :filterOption="false"
    >
      <template #options>
        <SelectOption v-for="{ label, value, type } of options" :key="value">
          <BuildOutlined v-if="type === 'page'" />
          <ContainerOutlined v-if="type === 'article'" />
          {{ label }}
        </SelectOption>
      </template>
    </AutoComplete>
    <Button size="small" class="mr-2" @click="remove(index)"
      ><template #icon><DeleteOutlined /></template
    ></Button>
    <Button v-if="index !== 0" size="small" class="mr-2" @click="moveUp(index)"
      ><template #icon><UpOutlined /></template
    ></Button>
    <Button v-if="index < menu.length - 1" size="small" @click="moveDown(index)"
      ><template #icon><DownOutlined /></template
    ></Button>
  </div>
  <Button @click="add"
    ><template #icon><PlusOutlined /></template
  ></Button>
</template>
