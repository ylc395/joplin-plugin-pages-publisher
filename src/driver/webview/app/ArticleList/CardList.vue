<script lang="ts">
import { Checkbox, Tag, Button, Tooltip } from 'ant-design-vue';
import { computed, defineComponent, inject, PropType } from 'vue';
import moment from 'moment';
import {
  CalendarOutlined,
  TagOutlined,
  EditOutlined,
  FileSyncOutlined,
  DiffOutlined,
} from '@ant-design/icons-vue';
import { token as articleToken } from '../../../../domain/service/ArticleService';
import { Article } from '../../../../domain/model/Article';
import { token as editToken } from './useEdit';
import { token as diffToken } from './useDiff';
import { openNote } from '../../utils';

export default defineComponent({
  components: {
    CalendarOutlined,
    TagOutlined,
    Checkbox,
    Tag,
    Tooltip,
    Button,
    EditOutlined,
    FileSyncOutlined,
    DiffOutlined,
  },
  props: { type: { required: true, type: String as PropType<'published' | 'unpublished'> } },
  setup(props) {
    const {
      publishedArticles,
      unpublishedArticles,
      toggleArticleSelected,
      selectedArticles,
      updateArticleContent,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    } = inject(articleToken)!;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { edit } = inject(editToken)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { viewDiff } = inject(diffToken)!;
    const articles = props.type === 'published' ? publishedArticles : unpublishedArticles;

    return {
      articles,
      toggleArticleSelected,
      isChecked(article: Article) {
        return computed(() => selectedArticles.value.includes(article));
      },
      moment,
      edit,
      updateArticleContent,
      viewDiff,
      openNote,
    };
  },
});
</script>
<template>
  <div
    v-for="article of articles"
    :key="article.noteId"
    class="flex border-b border-solid border-gray-200 last:border-b-0"
  >
    <div class="flex w-14 justify-center items-center flex-shrink-0">
      <Checkbox :checked="isChecked(article).value" @change="toggleArticleSelected(article)" />
    </div>
    <div class="py-4 flex-grow">
      <h2 class="font-normal text-base cursor-pointer" @click="openNote(article.noteId)">
        {{ article.title }}
      </h2>
      <div class="flex flex-col flex-wrap">
        <div class="info">
          <CalendarOutlined class="mr-2" />{{
            moment(article.createdAt).format('YYYY-MM-DD HH:mm')
          }}
          |
          {{ moment(article.updatedAt).format('YYYY-MM-DD HH:mm') }}
        </div>
        <div v-if="article.tags.length > 0" class="info">
          <TagOutlined class="mr-2" />
          <div class="">
            <Tag v-for="tag of article.tags" :key="tag">{{ tag }}</Tag>
          </div>
        </div>
      </div>
    </div>
    <div class="flex items-start justify-center flex-col w-40">
      <Button type="text" @click="edit(article)">
        <template #icon><EditOutlined /></template>
        Edit
      </Button>
      <template v-if="article.note && article.note.body !== article.content">
        <Tooltip title="View diff between article's content and Joplin note's content">
          <Button type="text" @click="viewDiff(article)">
            <template #icon><DiffOutlined /></template>
            View Diff
          </Button>
        </Tooltip>
        <Tooltip title="Overwrite article's content with Joplin note's current content">
          <Button type="text" @click="updateArticleContent(article)">
            <template #icon><FileSyncOutlined /></template>
            Sync with Joplin
          </Button>
        </Tooltip>
      </template>
    </div>
  </div>
</template>
<style scoped>
.info {
  display: flex;
  margin-bottom: 4px;
  align-items: center;
  color: rgb(153, 153, 153);
}

.info:last-child {
  margin-bottom: 0;
}
</style>
