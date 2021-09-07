import { generateSite as _generateSite } from '../utils';
import { Modal } from 'ant-design-vue';
import { ref } from 'vue';
import { container } from 'tsyringe';
import { ExceptionService } from '../../../domain/service/ExceptionService';

const isGenerating = ref(false);
const exceptionService = container.resolve(ExceptionService);

export function useGenerateSite() {
  const generateSite = () => {
    if (isGenerating.value) {
      return;
    }

    isGenerating.value = true;
    _generateSite()
      .then(
        () => Modal.success({ title: 'Site generated successfully' }),
        (e: Error) => exceptionService.reportError(e, { title: 'Fail to generate site' }),
      )
      .then(() => (isGenerating.value = false));
  };

  return { isGenerating, generateSite };
}
