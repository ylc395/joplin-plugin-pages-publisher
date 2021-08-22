import { ref, provide, InjectionKey, inject, computed } from 'vue';
import { bytesToBase64 } from 'byte-base64';
import type { Article } from '../../../../domain/model/Article';
import { token as articleToken } from '../../../../domain/service/ArticleService';
import { result } from 'lodash';

export const token: InjectionKey<ReturnType<typeof useEdit>> = Symbol();
export function useEdit() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { loadArticle, saveArticle, isValidUrl, updateArticleContent } = inject(articleToken)!;
  const isEditing = ref(false);
  const article = ref<Article | null>(null);
  const edit = async (_article: Article) => {
    isEditing.value = true;
    await loadArticle(_article);
    article.value = _article;
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

  const service = {
    isEditing,
    article,
    edit,
    stopEditing,
    saveArticle,
    isValidUrl,
    updateArticleContent,
    images,
  };

  provide(token, service);
  return service;
}
