import { InjectionKey, reactive } from 'vue';
import { container, InjectionToken, singleton } from 'tsyringe';
import { isEqual, last, pull } from 'lodash';
import { PluginDataRepository } from '../repository/PluginDataRepository';

export interface UI {
  openModal: (modal: {
    type: 'error' | 'confirm' | 'warning';
    title?: string;
    content?: string;
    onOk?: () => void;
    onCancel?: () => void;
    okText?: string;
    okType?: 'default' | 'primary';
    okDanger?: boolean;
    cancelText?: string;
    keepFormat?: boolean;
  }) => void;
  resizeWindow: (width: number, height: number) => void;
  getRootEl: () => HTMLElement;
}

export interface JoplinApp {
  quit: () => never;
  openNote: (noteId: string) => Promise<void>;
  getInstallationDir: () => Promise<string>;
  getDataDir: () => Promise<string>;
  getWindowSize: () => Promise<[number, number]>; // [0, 0] means do not set size
}

export enum FORBIDDEN {
  TAB_SWITCH,
  GENERATE,
}

export const uiToken: InjectionToken<UI> = Symbol();
export const joplinToken: InjectionToken<JoplinApp> = Symbol();
export const token: InjectionKey<AppService> = Symbol();

@singleton()
export class AppService {
  private readonly warnings: Record<FORBIDDEN, string[]> = reactive({
    [FORBIDDEN.TAB_SWITCH]: [],
    [FORBIDDEN.GENERATE]: [],
  });
  private readonly joplin = container.resolve(joplinToken);
  private readonly pluginDataRepository = new PluginDataRepository();

  readonly ui = container.resolve(uiToken);
  showingQuitButton = true;

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

  async init() {
    const [width, height] = await this.joplin.getWindowSize();

    if (!isEqual([width, height], [0, 0])) {
      this.ui.resizeWindow(width, height);
      this.showingQuitButton = false;
    }
  }

  getRootEl() {
    return this.ui.getRootEl();
  }

  openModal(...args: Parameters<UI['openModal']>) {
    return this.ui.openModal(...args);
  }

  quitApp() {
    return this.joplin.quit();
  }

  getDataDir() {
    return this.joplin.getDataDir();
  }
  async checkDb() {
    const isBroken = !(await this.pluginDataRepository.checkDb());

    if (isBroken) {
      const dir = await this.joplin.getDataDir();

      return new Promise<void>((resolve, reject) => {
        this.ui.openModal({
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
          keepFormat: true,
        });
      });
    }
  }
}
