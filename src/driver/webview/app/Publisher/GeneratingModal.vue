<script lang="ts">
import { computed, defineComponent, inject } from 'vue';
import { Modal, Progress, Result, Button } from 'ant-design-vue';
import { token as publishToken } from '../../../../domain/service/PublishService';
import { activeTabToken } from '../composable';
import { useModalProps, useOutputDir } from './composable';

export default defineComponent({
  components: { Modal, Progress, Result, Button },
  setup() {
    const {
      isGenerating,
      generatingProgress: progress,
      refreshGeneratingProgress,
      gitPush,
      isGithubInfoValid,
    } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(publishToken)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const activeTab = inject(activeTabToken)!;
    const reset = () => refreshGeneratingProgress(true);

    return {
      isGenerating,
      progress,
      visible: computed(() => isGenerating.value || !!progress.result),
      modalProps: useModalProps(),
      outputDir: useOutputDir(),
      reset,
      gitPush: async () => {
        await reset();
        await gitPush();
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
  <Modal v-model:visible="visible" v-bind="modalProps">
    <Progress
      v-if="isGenerating"
      :percent="(progress.generatedPages / progress.totalPages) * 100"
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
              >) have been generated. The root directory is:
            </p>
            <p class="break-all text-black font-semibold">{{ outputDir }}</p>
            <p>
              You can <strong>start a local HTTP server</strong> to preview the generated site(<a
                target="_blank"
                href="https://github.com/ylc395/joplin-plugin-page-publisher/blob/master/docs/how-to-preivew-before-publishing.md"
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
          <Button
            v-if="progress.result === 'success' && isGithubInfoValid"
            type="primary"
            @click="gitPush"
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
