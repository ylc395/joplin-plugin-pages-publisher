import { ref, provide, InjectionKey, inject, computed } from 'vue';
import { bytesToBase64 } from 'byte-base64';
import { mapValues, IsEqualCustomizer } from 'lodash';
import moment from 'moment';
import type { Article } from '../../../../domain/model/Article';
import { token as articleToken } from '../../../../domain/service/ArticleService';

export const token: InjectionKey<ReturnType<typeof useEdit>> = Symbol();
export function useEdit() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { loadArticle, saveArticle, isValidUrl, syncArticleContent } = inject(articleToken)!;
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

  const save = async (article: Partial<Article>) => {
    await saveArticle(article);
    stopEditing();
  };

  const customEqual: IsEqualCustomizer = (value, otherValue, key) => {
    const whitelist = ['url', 'title', 'content', 'createdAt', 'updatedAt', 'tags'];

    if (key && !whitelist.includes(String(key))) {
      return true;
    }

    const isMoment = moment.isMoment(value) || moment.isMoment(otherValue);
    if (isMoment) {
      return value.valueOf() === otherValue.valueOf();
    }
  };

  const service = {
    isEditing,
    article,
    edit,
    stopEditing,
    saveArticle: save,
    isValidUrl,
    syncArticleContent,
    images,
    customEqual,
  };

  provide(token, service);
  return service;
}
