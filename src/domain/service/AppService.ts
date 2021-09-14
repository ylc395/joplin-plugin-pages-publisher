import { InjectionKey, reactive } from 'vue';
import { singleton, InjectionToken, container } from 'tsyringe';
import { last, pull } from 'lodash';

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

export enum FORBIDDEN {
  TAB_SWITCH,
  GENERATE,
}

@singleton()
export class AppService {
  readonly app = container.resolve(appToken);
  private readonly warnings: Record<FORBIDDEN, string[]> = reactive({
    [FORBIDDEN.TAB_SWITCH]: [],
    [FORBIDDEN.GENERATE]: [],
  });

  setWarning(effect: FORBIDDEN, warning: string, add: boolean) {
    if (!warning) {
      throw new Error('invalid waring');
    }

    if (this.warnings[effect].includes(warning)) {
      pull(this.warnings[effect], warning);
    }

    if (add) {
      this.warnings[effect].push(warning);
    }
  }

  getLatestWarning(effect: FORBIDDEN) {
    return last(this.warnings[effect]);
  }
}
