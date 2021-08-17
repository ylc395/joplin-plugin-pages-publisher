<script lang="ts">
import { computed, defineComponent, inject, ref } from 'vue';
import { filter } from 'lodash';
import { Button, Collapse, Modal } from 'ant-design-vue';
import CardList from './CardList.vue';
import Edit from './Edit.vue';
import DiffView from './DiffView.vue';
import Search from './Search.vue';
import { token } from '../../../../domain/service/ArticleService';
import { useEdit } from './useEdit';
import { useDiff } from './useDiff';

export default defineComponent({
  components: {
    Button,
    CardList,
    Collapse,
    CollapsePanel: Collapse.Panel,
    Modal,
    Edit,
    DiffView,
    Search,
  },
  setup() {
    const {
      removeArticles,
      unpublishedArticles,
      publishedArticles,
      togglePublished,
      selectAll,
      selectedArticles,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    } = inject(token)!;
    const { isEditing } = useEdit();
    const activePanels = ref(['published', 'unpublished']);
    const handleSubmit = () => {
      if (!activePanels.value.includes('unpublished')) {
        activePanels.value = [...activePanels.value, 'unpublished'];
      }
    };
    const { isViewing: isViewingDiff, stopDiff: stopViewingDiff } = useDiff();

    return {
      isEditing,
      unpublishedArticles,
      publishedArticles,
      handleSubmit,
      activePanels,
      removeArticles,
      togglePublished,
      selectAll,
      selectedArticles,
      getModalContainer: () => document.querySelector('#joplin-plugin-content'),
      selectedPublishedLength: computed(
        () => filter(selectedArticles.value, { published: true }).length,
      ),
      selectedUnpublishedLength: computed(
        () => filter(selectedArticles.value, { published: false }).length,
      ),
      isViewingDiff,
      stopViewingDiff,
    };
  },
});
</script>
<template>
  <Search class="flex mb-2" @submit="handleSubmit" />
  <Button
    class="mb-2"
    size="large"
    danger
    :disabled="selectedArticles.length === 0"
    @click="removeArticles"
  >
    Remove{{ selectedArticles.length > 0 ? `(${selectedArticles.length})` : '' }}</Button
  >
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
        unpublishedArticles.length > 0 ? `(${unpublishedArticles.length})` : ''
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
  <Modal
    v-model:visible="isEditing"
    :getContainer="getModalContainer"
    :closable="false"
    :maskClosable="false"
    :footer="null"
  >
    <Edit />
  </Modal>
  <Modal
    v-model:visible="isViewingDiff"
    :getContainer="getModalContainer"
    :maskClosable="false"
    :footer="null"
    @cancel="stopViewingDiff"
  >
    <DiffView />
  </Modal>
</template>
<style scoped>
:deep(.ant-collapse-content > .ant-collapse-content-box) {
  padding: 0;
}
</style>