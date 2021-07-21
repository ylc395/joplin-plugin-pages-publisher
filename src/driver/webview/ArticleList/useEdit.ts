import { ref, provide, InjectionKey, inject } from 'vue';
import type { Article } from '../../../domain/model/Article';
import { token as articleToken } from '../../../domain/service/ArticleService';

export const token: InjectionKey<ReturnType<typeof useEdit>> = Symbol();
export function useEdit() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { loadArticle, saveArticle } = inject(articleToken)!;
  const isEditing = ref(false);
  const article = ref<Article | null>(null);
  const edit = async (_article: Article) => {
    await loadArticle(_article);
    article.value = _article;
    isEditing.value = true;
  };
  const stopEditing = () => {
    isEditing.value = false;
    article.value = null;
  };

  const service = { isEditing, article, edit, stopEditing, saveArticle };

  provide(token, service);
  return service;
}
