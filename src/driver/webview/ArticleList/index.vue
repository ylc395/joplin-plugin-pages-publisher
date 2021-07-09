<script lang="ts">
import { computed, defineComponent, inject, ref } from 'vue';
import { debounce, filter } from 'lodash';
import { Select, Button, Collapse, Tag } from 'ant-design-vue';
import CardList from './CardList.vue';
import { token } from '../../../domain/service/ArticleService';

export default defineComponent({
  components: {
    Select,
    SelectOption: Select.Option,
    Button,
    CardList,
    Collapse,
    CollapsePanel: Collapse.Panel,
    Tag,
  },
  setup() {
    const {
      searchedNotes,
      searchNotes,
      addNote,
      removeNote,
      removeArticles,
      submitAsArticles,
      unpublishedArticles,
      publishedArticles,
      togglePublished,
      selectAll,
      selectedArticles,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    } = inject(token)!;
    const selectedNoteIds = ref<string[]>([]);
    const activePanels = ref(['published', 'unpublished']);
    const submit = async () => {
      await submitAsArticles();
      selectedNoteIds.value = [];

      if (!activePanels.value.includes('unpublished')) {
        activePanels.value = [...activePanels.value, 'unpublished'];
      }
    };

    return {
      selectedNoteIds,
      searchNotes: debounce(searchNotes, 500),
      searchedNotes,
      unpublishedArticles,
      publishedArticles,
      submit,
      activePanels,
      addNote,
      removeNote,
      removeArticles,
      togglePublished,
      selectAll,
      selectedArticles,
      selectedPublishedLength: computed(
        () => filter(selectedArticles.value, { published: true }).length,
      ),
      selectedUnpublishedLength: computed(
        () => filter(selectedArticles.value, { published: false }).length,
      ),
    };
  },
});
</script>
<template>
  <div class="flex mb-2">
    <Select
      v-model:value="selectedNoteIds"
      class="flex-grow mr-3"
      size="large"
      placeholder="Search notes to add"
      mode="multiple"
      :filterOption="false"
      @search="searchNotes"
      @select="addNote"
      @deselect="removeNote"
    >
      <SelectOption
        v-for="note of searchedNotes"
        :key="note.id"
        :disabled="note.status !== 'none'"
        :title="note.title"
      >
        {{ note.title }}
        <Tag
          v-if="note.status !== 'none'"
          :color="note.status === 'unpublished' ? 'processing' : 'success'"
          >{{ note.status }}</Tag
        >
      </SelectOption>
    </Select>
    <Button
      :disabled="selectedNoteIds.length === 0"
      type="primary"
      size="large"
      class="mr-2"
      @click="submit"
    >
      Add
    </Button>
    <Button size="large" danger :disabled="selectedArticles.length === 0" @click="removeArticles">
      Remove{{ selectedArticles.length > 0 ? `(${selectedArticles.length})` : '' }}</Button
    >
  </div>
  <Collapse v-model:activeKey="activePanels">
    <CollapsePanel
      key="published"
      :header="`Published${publishedArticles.length > 0 ? `(${publishedArticles.length})` : ''}`"
    >
      <template #extra>
        <Button class="mr-1" size="small" type="primary" @click.stop="selectAll('published')"
          >Select All</Button
        >

        <Button
          size="small"
          type="primary"
          :disabled="selectedPublishedLength === 0"
          @click.stop="togglePublished('unpublished')"
          >Unpublish{{ selectedPublishedLength > 0 ? `(${selectedPublishedLength})` : '' }}</Button
        >
      </template>
      <CardList type="published" />
    </CollapsePanel>
    <CollapsePanel
      key="unpublished"
      :header="`Unpublished${
        unpublishedArticles.length > 0 ? `(${publishedArticles.length})` : ''
      }`"
    >
      <template #extra>
        <Button class="mr-1" size="small" type="primary" @click.stop="selectAll('unpublished')"
          >Select All</Button
        >
        <Button
          type="primary"
          size="small"
          :disabled="selectedUnpublishedLength === 0"
          @click.stop="togglePublished('published')"
          >Publish{{
            selectedUnpublishedLength > 0 ? `(${selectedUnpublishedLength})` : ''
          }}</Button
        >
      </template>
      <CardList type="unpublished" />
    </CollapsePanel>
  </Collapse>
</template>
<style scoped>
:deep(.ant-collapse-content > .ant-collapse-content-box) {
  padding: 0;
}
</style>
