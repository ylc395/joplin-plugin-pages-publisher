import { generateSite as _generateSite } from '../utils';
import { Modal } from 'ant-design-vue';
import { ref } from 'vue';

const isGenerating = ref(false);
export function useGenerateSite() {
  const generateSite = () => {
    if (isGenerating.value) {
      return;
    }

    isGenerating.value = true;
    _generateSite()
      .then(
        () => Modal.success({ title: 'Site generated successfully' }),
        (content) => Modal.error({ content, title: 'Oops!', style: { whiteSpace: 'pre-wrap' } }),
      )
      .then(() => (isGenerating.value = false));
  };

  return { isGenerating, generateSite };
}
