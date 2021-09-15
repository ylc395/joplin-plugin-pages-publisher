<script lang="ts">
import { defineComponent, inject, computed } from 'vue';
import { Modal, Progress, Result, Button } from 'ant-design-vue';
import { token as publishToken } from '../../../../domain/service/PublishService';
import { useModalProps } from './composable';

export default defineComponent({
  components: { Modal, Progress, Result, Button },
  setup() {
    const { isPublishing, publishingProgress, gitPush, refreshPublishingProgress, githubInfo } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(publishToken)!;

    return {
      visible: computed(() => isPublishing.value || !!publishingProgress.result),
      isPublishing,
      progress: publishingProgress,
      modalProps: useModalProps(),
      gitPush,
      githubInfo,
      reset: () => refreshPublishingProgress(true),
    };
  },
});
</script>
<template>
  <Modal v-model:visible="visible" v-bind="modalProps">
    <template v-if="isPublishing">
      <div>{{ progress.phase || 'Publishing...' }}</div>
      <Progress :percent="(progress.loaded / progress.total) * 100" />
      <div>{{ progress.message }}</div>
    </template>
    <div v-if="progress.result">
      <Result
        class="py-3 px-4"
        :status="progress.result === 'fail' ? 'error' : 'success'"
        :title="progress.result === 'fail' ? 'Fail to publish' : 'Published Successfully'"
      >
        <template #subTitle>
          <div v-if="progress.result === 'fail'">
            {{ progress.phase ? `${progress.phase}: ` : '' }}{{ progress.message }}
          </div>
          <div v-else-if="githubInfo">
            Check it in
            <strong class="text-black"
              >https://{{ githubInfo.userName }}.{{ githubInfo.repositoryName }}.com</strong
            >
          </div>
        </template>
        <template #extra>
          <Button v-if="progress.result" @click="reset">Confirm</Button>
          <Button v-if="progress.result === 'fail'" @click="gitPush">Retry</Button>
        </template>
      </Result>
    </div>
  </Modal>
</template>
