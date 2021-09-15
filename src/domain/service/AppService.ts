import { InjectionKey, reactive, ref, Ref } from 'vue';
import { singleton } from 'tsyringe';
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

export enum FORBIDDEN {
  TAB_SWITCH,
  GENERATE,
}

export const token: InjectionKey<AppService> = Symbol();
@singleton()
export class AppService {
  private readonly warnings: Record<FORBIDDEN, string[]> = reactive({
    [FORBIDDEN.TAB_SWITCH]: [],
    [FORBIDDEN.GENERATE]: [],
  });

  readonly modal: Ref<Modal | null> = ref(null);

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

  openModal(modal: Modal) {
    this.modal.value = modal;
  }
}
