<script lang="ts">
import { defineComponent, inject, ref } from 'vue';
import { debounce } from 'lodash';
import { Select, Button, Collapse } from 'ant-design-vue';
import Card from './Card.vue';
import { token, SearchedNote } from '../../../domain/service/ArticleService';

export default defineComponent({
  components: {
    Select,
    SelectOption: Select.Option,
    Button,
    Card,
    Collapse,
    CollapsePanel: Collapse.Panel,
  },
  setup() {
    const {
      searchedNotes,
      searchNotes,
      addAsArticles,
      unpublishedArticles,
      publishedArticles,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    } = inject(token)!;
    const selectedItems = ref<SearchedNote[]>([]);
    const addButtonLoading = ref(false);
    const add = async () => {
      addButtonLoading.value = true;
      await addAsArticles(...selectedItems.value);
      addButtonLoading.value = false;
      selectedItems.value = [];
    };

    return {
      selectedItems,
      searchNotes: debounce(searchNotes, 500),
      searchedNotes,
      unpublishedArticles,
      publishedArticles,
      add,
    };
  },
});
</script>
<template>
  <div class="search-area">
    <Select
      v-model:value="selectedItems"
      class="select"
      size="large"
      placeholder="Search notes to add"
      mode="multiple"
      :filterOption="false"
      @search="searchNotes"
    >
      <SelectOption
        v-for="note of searchedNotes"
        :key="note.id"
        :disabled="note.status !== 'none'"
        :title="note.title"
      >
        {{ note.title }}
      </SelectOption>
    </Select>
    <Button type="primary" class="button" size="large" @click="add"> Add </Button>
  </div>
  <Collapse>
    <CollapsePanel>
      <Card v-for="article of unpublishedArticles" :key="article.noteId" :article="article" />
    </CollapsePanel>
    <CollapsePanel>
      <Card v-for="article of publishedArticles" :key="article.noteId" :article="article" />
    </CollapsePanel>
  </Collapse>
</template>
<style scoped>
.search-area {
  display: flex;
}

.select {
  flex-grow: 1;
  margin-right: 10px;
}

.button {
  width: fit-content;
}
</style>
