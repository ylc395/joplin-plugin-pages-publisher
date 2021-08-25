import { ref, provide, InjectionKey, inject, computed } from 'vue';
import { bytesToBase64 } from 'byte-base64';
import { mapValues } from 'lodash';
import moment from 'moment';
import type { Article } from '../../../../domain/model/Article';
import { token as articleToken } from '../../../../domain/service/ArticleService';

export const token: InjectionKey<ReturnType<typeof useEdit>> = Symbol();
export function useEdit() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { loadArticle, saveArticle, isValidUrl, updateArticleContent } = inject(articleToken)!;
  const isEditing = ref(false);
  const article = ref<Article | null>(null);
  const edit = async (_article: Article) => {
    isEditing.value = true;
    await loadArticle(_article);
    article.value = mapValues(_article, (value, key) => {
      return ['createdAt', 'updatedAt'].includes(key) ? moment(value as number) : value;
    }) as Article;
  };
  const stopEditing = () => {
    isEditing.value = false;
    article.value = null;
  };
  const images = computed(() => {
    return (
      article.value?.images?.map((img) => ({
        name: img.attachmentFilename,
        url: `data:${img.contentType};base64,${bytesToBase64(img.body)}`,
      })) || []
    );
  });

  const save = async (article: Article) => {
    const result = mapValues(article, (value) => {
      if (moment.isMoment(value)) {
        return Number(value.format('x'));
      }

      return value;
    }) as Article;

    await saveArticle(result);
    stopEditing();

    return result;
  };

  const service = {
    isEditing,
    article,
    edit,
    stopEditing,
    saveArticle: save,
    isValidUrl,
    updateArticleContent,
    images,
  };

  provide(token, service);
  return service;
}
