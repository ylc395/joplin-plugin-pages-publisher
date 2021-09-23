import { InjectionKey, reactive } from 'vue';
import { container, InjectionToken, singleton } from 'tsyringe';
import { last, pull } from 'lodash';
import { ButtonProps } from 'ant-design-vue';

export interface Modal {
  type: 'error' | 'confirm' | 'warning';
  title?: string;
  content?: string;
  onOk?: () => void;
  onCancel?: () => void;
  okButtonProps?: ButtonProps;
}

export interface JoplinApp {
  quitApp: () => never;
  openNote: (noteId: string) => Promise<void>;
  installationDir: () => Promise<string>;
}

export enum FORBIDDEN {
  TAB_SWITCH,
  GENERATE,
}

export const openModalToken: InjectionToken<(modal: Modal) => void> = Symbol();
export const joplinToken: InjectionToken<JoplinApp> = Symbol();
export const token: InjectionKey<AppService> = Symbol();

@singleton()
export class AppService {
  private readonly warnings: Record<FORBIDDEN, string[]> = reactive({
    [FORBIDDEN.TAB_SWITCH]: [],
    [FORBIDDEN.GENERATE]: [],
  });
  private readonly joplin = container.resolve(joplinToken);

  readonly openModal = container.resolve(openModalToken);

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

  openNote(id: string) {
    return this.joplin.openNote(id);
  }

  quitApp() {
    return this.joplin.quitApp();
  }
}
