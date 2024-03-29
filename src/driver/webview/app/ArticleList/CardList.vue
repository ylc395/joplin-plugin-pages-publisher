<script lang="ts">
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Checkbox, Tag, Button, Tooltip } from 'ant-design-vue';
import { computed, defineComponent, inject, onUnmounted, PropType } from 'vue';
import moment from 'moment';
import {
  CalendarOutlined,
  TagOutlined,
  EditOutlined,
  FileSyncOutlined,
  LinkOutlined,
} from '@ant-design/icons-vue';
import { capitalize } from 'lodash';
import type { Article } from 'domain/model/Article';
import { token as articleToken } from 'domain/service/ArticleService';
import { token as noteToken } from 'domain/service/NoteService';
import { token as appToken } from 'domain/service/AppService';
import { token as pageToken } from 'domain/service/PageService';
import { token as editToken } from './useEdit';
import { token as diffToken } from './useDiff';

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
    LinkOutlined,
  },
  props: { type: { required: true, type: String as PropType<'published' | 'unpublished'> } },
  setup(props) {
    const {
      publishedArticles,
      unpublishedArticles,
      toggleArticleSelected,
      selectedArticles,
      syncArticleContent,
    } = inject(articleToken)!;
    const { syncNotes } = inject(noteToken)!;
    const { articlePage } = inject(pageToken)!;
    const { edit } = inject(editToken)!;
    const { viewDiff } = inject(diffToken)!;
    const { openNote } = inject(appToken)!;

    window.addEventListener('focus', syncNotes);
    onUnmounted(() => window.removeEventListener('focus', syncNotes));

    const articles = props.type === 'published' ? publishedArticles : unpublishedArticles;

    return {
      articles,
      articlePage,
      toggleArticleSelected,
      moment,
      edit,
      syncArticleContent,
      viewDiff,
      openNote,
      capitalize,
      tagColors: {
        diff: 'orange',
        deleted: 'red',
      },
      tagTips: {
        diff: "There are diffs between article's content and Joplin note's content. Click to view.",
        deleted: 'Origin note has been deleted.',
      },
      isChecked(article: Article) {
        return computed(() => selectedArticles.value.includes(article));
      },
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
      <h2
        class="font-normal text-base"
        :class="{ 'cursor-pointer': article.note }"
        @click="article.note && openNote(article.noteId)"
      >
        {{ article.title }}
        <Tooltip
          v-if="article.syncStatus && article.syncStatus !== 'synced'"
          :title="tagTips[article.syncStatus]"
        >
          <Tag
            :color="tagColors[article.syncStatus]"
            :class="{ 'cursor-default': article.syncStatus !== 'diff' }"
            @click.stop="article.syncStatus === 'diff' && viewDiff(article)"
          >
            {{ capitalize(article.syncStatus) }}
          </Tag>
        </Tooltip>
      </h2>
      <div class="flex flex-col flex-wrap">
        <div v-if="articlePage" class="info">
          <LinkOutlined class="mr-2" />{{ articlePage.url.value }}/{{ article.url }}
        </div>
        <div class="info">
          <CalendarOutlined class="mr-2" />{{
            moment(article.createdAt).format('YYYY-MM-DD HH:mm')
          }}
          |
          {{ moment(article.updatedAt).format('YYYY-MM-DD HH:mm') }}
        </div>
        <div v-if="article.tags.length > 0" class="info">
          <TagOutlined class="mr-2" />
          <Tag v-for="tag of article.tags" :key="tag">{{ tag }}</Tag>
        </div>
      </div>
    </div>
    <div class="flex items-start justify-center flex-col w-32">
      <Button type="text" @click="edit(article)">
        <template #icon><EditOutlined /></template>
        Edit
      </Button>
      <template v-if="article.note && article.note.body !== article.content">
        <Tooltip title="Overwrite article's content with Joplin note's current content">
          <Button type="text" @click="syncArticleContent(article)">
            <template #icon><FileSyncOutlined /></template>
            Sync
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
  font-size: 12px;
}

.info:last-child {
  margin-bottom: 0;
}
</style>
