<script lang="ts">
import { defineComponent, inject, computed } from 'vue';
import { Modal, Progress, Result, Button } from 'ant-design-vue';
import { GitEvents, token as publishToken } from '../../../../domain/service/PublishService';
import { useModalProps } from './composable';

export default defineComponent({
  components: { Modal, Progress, Result, Button },
  setup() {
    const {
      isPublishing,
      publishingProgress: progress,
      publish,
      refreshPublishingProgress,
      githubInfo,
    } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(publishToken)!;

    return {
      visible: computed(() => isPublishing.value || !!progress.result),
      isPublishing,
      progress,
      modalProps: useModalProps(),
      publish: () => publish(false),
      gitPushForce: () => publish(true),
      githubInfo,
      reset: () => refreshPublishingProgress(),
      needForce: computed(() => progress.message.includes('not a simple fast-forward')),
      isAuthError: computed(() => progress.message === GitEvents.AUTH_FAIL),
      message: computed(() => {
        const prefix = progress.phase ? `${progress.phase}: ` : '';
        if (progress.message === GitEvents.AUTH_FAIL) {
          return `${prefix}${progress.message}. Probably your Github information, including token, is invalid.`;
        }
        return `${prefix}${progress.message}`;
      }),
    };
  },
});
</script>
<template>
  <Modal :visible="visible" v-bind="modalProps">
    <template v-if="isPublishing">
      <div>{{ progress.phase || 'Publishing...' }}</div>
      <Progress :percent="(progress.loaded / progress.total) * 100" :showInfo="false" />
      <div>{{ progress.message }}</div>
    </template>
    <div v-if="progress.result">
      <Result
        class="py-3 px-4"
        :status="progress.result === 'fail' ? 'error' : 'success'"
        :title="progress.result === 'fail' ? 'Fail to publish' : 'Published Successfully'"
      >
        <template #subTitle>
          <div v-if="progress.result === 'fail'" class="text-left">
            <p>{{ message }}</p>
            <p>
              <template v-if="!isAuthError"
                >This is an unexpected error, you can report it as a Github issue. You may retry, or
                restart Joplin and try publishing again.
              </template>
              Or if you are a Git user, you can use Git manually to continue publishing.
              <a
                href="https://github.com/ylc395/joplin-plugin-page-publisher/blob/master/docs/how-to-use-git-manually.md"
                target="_blank"
                >See this docs for details</a
              >
            </p>
          </div>
          <div v-else-if="githubInfo">
            Please Check
            <span class="text-gray-400"
              >https://github.com/{{ githubInfo.userName }}/{{ githubInfo.repositoryName
              }}{{ githubInfo.branch ? `/tree/${githubInfo.branch}` : '' }}</span
            >
          </div>
        </template>
        <template #extra>
          <Button v-if="progress.result" @click="reset">Confirm</Button>
          <template v-if="progress.result === 'fail'">
            <Button v-if="!needForce && !isAuthError" type="primary" @click="publish">Retry</Button>
            <Button v-if="needForce" type="primary" danger @click="gitPushForce"
              >Retry FORCE PUSH</Button
            >
          </template>
        </template>
      </Result>
    </div>
  </Modal>
</template>
