import { ref, watch } from 'vue';
import { AppService, FORBIDDEN } from '../../../domain/service/AppService';
import { message } from 'ant-design-vue';

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

  return activeKey;
}
