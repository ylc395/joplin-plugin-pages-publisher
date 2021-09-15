import { ref, watch, provide, InjectionKey } from 'vue';
import { message } from 'ant-design-vue';
import { AppService, FORBIDDEN } from '../../../domain/service/AppService';
import { openModal } from '../utils/webviewApi';

export const activeTabToken: InjectionKey<ReturnType<typeof useActiveTabPane>> = Symbol();
export function useActiveTabPane({ getLatestWarning }: AppService) {
  const activeKey = ref('Site');

  let doNotRun = false;
  watch(activeKey, (_, oldKey) => {
    if (doNotRun) {
      doNotRun = false;
      return;
    }

    const warning = getLatestWarning(FORBIDDEN.TAB_SWITCH);
    if (warning) {
      doNotRun = true;
      message.warn({ content: warning, duration: 0.5 });
      activeKey.value = oldKey;
    }
  });

  provide(activeTabToken, activeKey);

  return activeKey;
}
