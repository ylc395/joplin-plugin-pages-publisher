import { ref, watch } from 'vue';
import type { AppService } from '../../../domain/service/AppService';
import { message } from 'ant-design-vue';

export function useActiveTabPane({ isAppBlocked }: AppService) {
  const activeKey = ref('Site');

  let doNotRun = false;
  watch(activeKey, (_, oldKey) => {
    if (doNotRun) {
      doNotRun = false;
      return;
    }

    if (isAppBlocked.value) {
      doNotRun = true;
      message.warn({ content: 'Please save before leaving.', duration: 0.5 });
      activeKey.value = oldKey;
    }
  });

  return activeKey;
}
