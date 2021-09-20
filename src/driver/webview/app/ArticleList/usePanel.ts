import { without } from 'lodash';
import { ref, watch, inject } from 'vue';
import { token as articleToken } from 'domain/service/ArticleService';

export function usePanel() {
  const {
    unpublishedArticles,
    publishedArticles,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  } = inject(articleToken)!;

  const activePanels = ref(['published', 'unpublished']);

  const handleSubmit = () => {
    if (!activePanels.value.includes('unpublished')) {
      activePanels.value = [...activePanels.value, 'unpublished'];
    }
  };

  watch(
    [publishedArticles, unpublishedArticles],
    () => {
      if (publishedArticles.value.length === 0) {
        activePanels.value = without(activePanels.value, 'published');
      }
      if (unpublishedArticles.value.length === 0) {
        activePanels.value = without(activePanels.value, 'unpublished');
      }
    },
    { immediate: true },
  );

  return { activePanels, handleSubmit };
}
