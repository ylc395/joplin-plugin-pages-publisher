<script lang="ts">
import { defineComponent, inject, computed } from 'vue';
import { Modal, Progress, Result, Button } from 'ant-design-vue';
import { token as publishToken } from '../../../../domain/service/PublishService';
import { useModalProps } from './composable';

export default defineComponent({
  components: { Modal, Progress, Result, Button },
  setup() {
    const {
      isPublishing,
      publishingProgress: progress,
      gitPush,
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
      gitPush,
      gitPushForce: () => gitPush(true),
      githubInfo,
      reset: () => refreshPublishingProgress(true),
      needForce: computed(() => progress.message.includes('not a simple fast-forward')),
      is401Error: computed(() => progress.message.includes('401')),
      message: computed(() => {
        const prefix = progress.phase ? `${progress.phase}: ` : '';
        if (progress.message.includes('401')) {
          return `${prefix}${progress.message}. Probably your token is invalid.`;
        }
        return `${prefix}${progress.message}`;
      }),
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
          <div v-if="progress.result === 'fail'" class="text-left">
            <p>{{ message }}</p>
            <p>
              Or, if you are a Git user, you can use Git manually.
              <a href="https://github.com" target="_blank">See this docs for details</a>
            </p>
          </div>
          <div v-else-if="githubInfo">
            Please Check
            <strong class="text-black"
              >https://github.com/{{ githubInfo.userName }}/{{ githubInfo.repositoryName }}</strong
            >
          </div>
        </template>
        <template #extra>
          <Button v-if="progress.result" @click="reset">Confirm</Button>
          <template v-if="progress.result === 'fail'">
            <Button v-if="!needForce && !is401Error" type="primary" @click="gitPush">Retry</Button>
            <Button v-if="needForce" type="primary" danger @click="gitPushForce"
              >Retry FORCE PUSH</Button
            >
          </template>
        </template>
      </Result>
    </div>
  </Modal>
</template>
