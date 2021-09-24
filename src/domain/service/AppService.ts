import { InjectionKey, reactive } from 'vue';
import { container, InjectionToken, singleton } from 'tsyringe';
import { last, pull } from 'lodash';
import { PluginDataRepository } from '../repository/PluginDataRepository';

export interface Modal {
  type: 'error' | 'confirm' | 'warning';
  title?: string;
  content?: string;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: string;
  okType?: 'default' | 'primary';
  okDanger?: boolean;
  cancelText?: string;
  class?: string;
}

export interface JoplinApp {
  quitApp: () => never;
  openNote: (noteId: string) => Promise<void>;
  installationDir: () => Promise<string>;
  dataDir: () => Promise<string>;
}

export enum FORBIDDEN {
  TAB_SWITCH,
  GENERATE,
}

export const openModalToken: InjectionToken<(modal: Modal) => void> = Symbol();
export const joplinToken: InjectionToken<JoplinApp> = Symbol();
export const token: InjectionKey<AppService> = Symbol();

export const MODAL_CLASS_NAME = 'text-print-modal';

@singleton()
export class AppService {
  private readonly warnings: Record<FORBIDDEN, string[]> = reactive({
    [FORBIDDEN.TAB_SWITCH]: [],
    [FORBIDDEN.GENERATE]: [],
  });
  private readonly joplin = container.resolve(joplinToken);
  private readonly pluginDataRepository = new PluginDataRepository();

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

  async checkDb() {
    const isBroken = !(await this.pluginDataRepository.checkDb());

    if (isBroken) {
      const dir = await this.joplin.dataDir();

      return new Promise<void>((resolve, reject) => {
        this.openModal({
          type: 'confirm',
          title: 'Data File was broken!',
          content: `This plugin's data file will be totally overwrote if you continue.\nYou can check the data file in:\n\n${dir}/db.json`,
          okText: 'Continue',
          cancelText: 'Quit',
          onCancel: () => {
            reject();
            this.quitApp();
          },
          onOk: resolve,
          okType: 'default',
          okDanger: true,
          class: MODAL_CLASS_NAME,
        });
      });
    }
  }
}
