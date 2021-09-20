import { provide, ref, shallowRef, InjectionKey } from 'vue';
import Diff, { diffChars } from 'diff';
import type { Article } from 'domain/model/Article';

export const token: InjectionKey<ReturnType<typeof useDiff>> = Symbol();
export function useDiff() {
  const isViewing = ref(false);
  const diffInfo = shallowRef<Diff.Change[]>([]);

  const viewDiff = (article: Article) => {
    isViewing.value = true;
    diffInfo.value = diffChars(article.note?.body || '', article.content);
  };

  const stopDiff = () => {
    isViewing.value = false;
    diffInfo.value = [];
  };

  const service = { isViewing, diffInfo, viewDiff, stopDiff };
  provide(token, service);
  return service;
}
