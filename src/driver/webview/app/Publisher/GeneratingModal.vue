<script lang="ts">
import { computed, defineComponent, inject } from 'vue';
import { Modal, Progress, Result, Button } from 'ant-design-vue';
import { token as publishToken } from 'domain/service/PublishService';
import { token as previewToken } from 'domain/service/PreviewService';
import { activeTabToken } from '../composable';
import { useModalProps } from './composable';

export default defineComponent({
  components: { Modal, Progress, Result, Button },
  setup() {
    const {
      isGenerating,
      generatingProgress: progress,
      refreshGeneratingProgress,
      publish,
      isGithubInfoValid,
      outputDir,
    } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(publishToken)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const activeTab = inject(activeTabToken)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { startPreviewing } = inject(previewToken)!;
    const reset = () => refreshGeneratingProgress();

    return {
      isGenerating,
      progress,
      visible: computed(() => isGenerating.value || !!progress.result),
      modalProps: useModalProps(),
      outputDir,
      reset,
      publish: async () => {
        await reset();
        await publish();
      },
      preview: async () => {
        await reset();
        startPreviewing();
      },
      isGithubInfoValid,
      switchToGithubTab: async () => {
        await reset();
        activeTab.value = 'Github';
      },
    };
  },
});
</script>
<template>
  <Modal :visible="visible" v-bind="modalProps">
    <Progress
      v-if="isGenerating"
      :percent="(progress.generatedPages / progress.totalPages) * 100"
      :showInfo="false"
    />
    <div v-if="progress.result">
      <Result
        class="py-3 px-4"
        :status="progress.result === 'fail' ? 'error' : 'success'"
        :title="progress.result === 'fail' ? 'Fail to generate' : 'Generated Successfully'"
      >
        <template #subTitle>
          <div v-if="progress.result === 'fail'" class="subTitle">
            {{ progress.message }}
          </div>
          <div v-else class="subTitle">
            <p>
              Site(<strong>{{ progress.message }}</strong
              >) has been generated. The root directory is:
            </p>
            <p class="break-all text-black font-semibold">{{ outputDir }}</p>
            <p>
              You can click <strong>Preview</strong> button to preview the generated site<template
                v-if="isGithubInfoValid"
                >, or you can <strong>click "Publish" button</strong> to publish them to Github
                directly.</template
              ><template v-else>. </template>
            </p>
            <p v-if="!isGithubInfoValid">
              You can't publish your site to Github directly, because
              <strong>you haven't filled/saved all your Github information correctly</strong>.
            </p>
          </div>
        </template>
        <template #extra>
          <Button v-if="progress.result" @click="reset">Confirm</Button>
          <Button v-if="progress.result === 'success'" @click="preview">Preview</Button>
          <Button
            v-if="progress.result === 'success' && isGithubInfoValid"
            type="primary"
            @click="publish"
            >Publish</Button
          >
          <Button
            v-if="progress.result === 'success' && !isGithubInfoValid"
            @click="switchToGithubTab"
            >Edit Github information</Button
          >
        </template>
      </Result>
    </div>
  </Modal>
</template>
<style scoped>
.subTitle {
  @apply text-left whitespace-pre-line;
}
</style>
