import { computed, InjectionKey, ref, Ref } from 'vue';
import { singleton, InjectionToken, container } from 'tsyringe';
import { filter, first, isString, omit, some } from 'lodash';

export const appToken: InjectionToken<App> = Symbol();
interface App {
  openModal: (type: 'error' | 'confirm', args: { title?: string; content?: string }) => void;
  quit: () => Promise<void>;
  openNote: (noteId: string) => Promise<void>;
  generateSite: () => Promise<string[]>;
  getOutputDir: () => Promise<string>;
  getGitRepositoryDir: () => Promise<string>;
}

export const token: InjectionKey<AppService> = Symbol();

@singleton()
export class AppService {
  private readonly blockInfos: Ref<Record<string, string>> = ref({});
  readonly app = container.resolve(appToken);
  readonly isAppBlocked = computed(() => {
    return some(this.blockInfos.value, isString);
  });

  readonly appBlockInfo = computed(() => {
    return first(filter(this.blockInfos.value));
  });
  setBlockFlag(flag: string, value: boolean | string) {
    this.blockInfos.value = value
      ? { ...this.blockInfos.value, [flag]: isString(value) ? value : '' }
      : omit(this.blockInfos.value, [flag]);
  }
}
