<script lang="ts">
import { computed, defineComponent, inject, ref } from 'vue';
import { Modal, Progress, Result, Button } from 'ant-design-vue';
import { token as publishToken } from '../../../../domain/service/PublishService';
import { getOutputDir } from '../../utils/webviewApi';
import { activeTabToken } from '../composable';

export default defineComponent({
  components: { Modal, Progress, Result, Button },
  setup() {
    const { isGenerating, progress, refreshProgress, gitPush, isGithubInfoValid } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(publishToken)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const activeTab = inject(activeTabToken)!;
    const outputDir = ref('');
    const reset = () => refreshProgress(true);
    getOutputDir().then((result) => (outputDir.value = result));

    return {
      isGenerating,
      progress,
      visible: computed(() => isGenerating.value || !!progress.result),
      format: () => `${progress.generatedPages}/${progress.totalPages}`,
      modalProps: {
        mask: false,
        closable: false,
        footer: null,
        getContainer: () => document.querySelector('#joplin-plugin-content'),
      },
      outputDir,
      reset,
      gitPush,
      isGithubInfoValid,
      switchToGithubTab: () => {
        reset();
        activeTab.value = 'Github';
      },
    };
  },
});
</script>
<template>
  <Modal v-model:visible="visible" v-bind="modalProps" width="400px">
    <Progress
      v-if="isGenerating"
      :percent="(progress.generatedPages / progress.totalPages) * 100"
      :format="format"
    />
    <div v-if="progress.result">
      <Result
        class="py-3 px-4"
        :status="progress.result === 'fail' ? 'error' : 'success'"
        :title="progress.result === 'fail' ? 'Fail to generate' : 'Generated Successfully'"
      >
        <template #subTitle>
          <div v-if="progress.result === 'fail'" class="subTitle">
            {{ progress.reason }}
          </div>
          <div v-else class="subTitle">
            <p>
              Site(<strong>{{ progress.reason }} files included</strong>) have been generated. The
              root directory is:
            </p>
            <p class="break-all text-black font-semibold">{{ outputDir }}</p>
            <p>
              You can <strong>start a local HTTP server</strong> to preview the generated site(<a
                target="_blank"
                href="https://github.com/"
                >I don't know how to do it</a
              >)<template v-if="isGithubInfoValid"
                >, or/and you can <strong>click "Publish" button</strong> to publish them to Github
                directly.</template
              ><template v-else
                >. You can't publish your site to Github directly, because
                <strong>you haven't filled/saved all your Github information correctly</strong
                >.</template
              >
            </p>
          </div>
        </template>
        <template #extra>
          <Button v-if="progress.result" @click="reset">Confirm</Button>
          <Button v-if="progress.result === 'success' && isGithubInfoValid" @click="gitPush"
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
