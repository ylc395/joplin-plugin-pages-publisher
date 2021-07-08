<script lang="ts">
import { token } from '../../../domain/service/ArticleService';
import { computed, defineComponent, inject, PropType } from 'vue';
import { CalendarOutlined, TagOutlined } from '@ant-design/icons-vue';
import { Checkbox } from 'ant-design-vue';
import { Article } from 'src/domain/model/Article';

export default defineComponent({
  components: { CalendarOutlined, TagOutlined, Checkbox },
  props: { type: { required: true, type: String as PropType<'published' | 'unpublished'> } },
  setup(props) {
    const { publishedArticles, unpublishedArticles, toggleArticleSelected, selectedArticles } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(token)!;
    const articles = props.type === 'published' ? publishedArticles : unpublishedArticles;

    return {
      articles,
      toggleArticleSelected,
      isChecked(article: Article) {
        return computed(() => selectedArticles.value.includes(article));
      },
    };
  },
});
</script>
<template>
  <div v-for="article of articles" :key="article.noteId" class="card">
    <div class="checkbox">
      <Checkbox :checked="isChecked(article)" @change="toggleArticleSelected(article)" />
    </div>
    <div>
      <h2 class="card-title">{{ article.title }}</h2>
      <div class="card-info">
        <div><CalendarOutlined />{{ article.createdAt }} | {{ article.updatedAt }}</div>
        <div>
          <TagOutlined /><span v-for="tag of article.tags" :key="tag">{{ tag }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.card {
  display: flex;
}

.checkbox {
  display: flex;
  width: 60px;
  justify-content: center;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: normal;
}

.card-info {
  display: flex;
}
</style>
