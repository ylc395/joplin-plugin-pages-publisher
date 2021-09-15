import { ref, computed } from 'vue';
import { getOutputDir } from '../../utils/webviewApi';
export function useModalProps() {
  return {
    mask: false,
    closable: false,
    footer: null,
    width: '400px',
    getContainer: () => document.querySelector('#joplin-plugin-content'),
  };
}

const outputDir = ref('');
getOutputDir().then((result) => (outputDir.value = result));
export function useOutputDir() {
  return computed(() => outputDir.value);
}
