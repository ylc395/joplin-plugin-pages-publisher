<script lang="ts">
import { defineComponent, PropType, Ref, watch, ref, inject, computed } from 'vue';
import { Input, Select, Button } from 'ant-design-vue';
import { PlusOutlined, UpOutlined, DownOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { cloneDeep, reject } from 'lodash';
import { ARTICLE_PAGE_NAME, Menu } from 'domain/model/Page';
import { token as articleToken } from 'domain/service/ArticleService';
import { token as pageToken } from 'domain/service/PageService';

export default defineComponent({
  components: { Input, Select, Button, PlusOutlined, UpOutlined, DownOutlined, DeleteOutlined },
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
          pages.value.map(({ name, readableName }) => ({ label: readableName, value: name })),
          { value: ARTICLE_PAGE_NAME },
        ),
        ...articles.map(({ noteId, title }) => ({ label: title, value: noteId })),
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
    <Input v-model:value="item.label" class="w-36 mr-2" placeholder="Menu item label" />
    <Select
      v-model:value="item.link"
      class="w-36 mr-4"
      placeholder="Select a target page for menu item"
      :options="options"
    ></Select>
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
