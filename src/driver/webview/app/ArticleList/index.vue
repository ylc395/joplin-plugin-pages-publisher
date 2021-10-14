<script lang="ts">
import { computed, defineComponent, inject } from 'vue';
import { filter } from 'lodash';
import { Button, Collapse, Modal, Alert } from 'ant-design-vue';
import CardList from './CardList.vue';
import Edit from './Edit.vue';
import DiffView from './DiffView.vue';
import Search from './Search.vue';
import { token as articleToken } from 'domain/service/ArticleService';
import { token as pageToken } from 'domain/service/PageService';
import { token as appToken } from 'domain/service/AppService';
import { useEdit } from './useEdit';
import { useDiff } from './useDiff';
import { usePanel } from './usePanel';

export default defineComponent({
  components: {
    Alert,
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
    } = inject(articleToken)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { articlePage } = inject(pageToken)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { getRootEl } = inject(appToken)!;
    const { isEditing } = useEdit();
    const { handleSubmit, activePanels } = usePanel();
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
      getModalContainer: getRootEl,
      selectedPublishedLength: computed(
        () => filter(selectedArticles.value, { published: true }).length,
      ),
      selectedUnpublishedLength: computed(
        () => filter(selectedArticles.value, { published: false }).length,
      ),
      isViewingDiff,
      stopViewingDiff,
      articlePage,
    };
  },
});
</script>
<template>
  <Alert
    v-if="!articlePage"
    banner
    message="There is no article page in this theme, so no article will be published"
    class="mb-4"
  />
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
      :disabled="publishedArticles.length === 0"
      :header="`Published(${publishedArticles.length})`"
    >
      <template #extra>
        <Button class="mr-1" size="small" @click.stop="selectAll('published')">Select All</Button>

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
      :disabled="unpublishedArticles.length === 0"
      :header="`Unpublished(${unpublishedArticles.length})`"
    >
      <template #extra>
        <Button class="mr-1" size="small" @click.stop="selectAll('unpublished')">Select All</Button>
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
    :visible="isEditing"
    :destroyOnClose="true"
    :getContainer="getModalContainer"
    :closable="false"
    :maskClosable="false"
    :footer="null"
  >
    <Edit />
  </Modal>
  <Modal
    :visible="isViewingDiff"
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
