<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Modal, Progress, Result, Button } from 'ant-design-vue';
import { token as publishToken } from 'domain/service/PublishService';
import { PublishResults } from 'domain/model/Publishing';
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
      stopPublishing,
      isDefaultRepository,
      isRepositoryMissing,
      repositoryName,
    } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(publishToken)!;

    return {
      isPublishing,
      stopPublishing,
      progress,
      modalProps: useModalProps(),
      publish,
      githubInfo,
      PublishResults,
      reset: () => refreshPublishingProgress(),
      isDefaultRepository,
      repositoryName,
      isRepositoryMissing,
    };
  },
});
</script>
<template>
  <Modal :visible="isPublishing" v-bind="modalProps">
    <div>{{ progress.phase || 'Publishing...' }}</div>
    <Progress :percent="(progress.loaded / progress.total) * 100" :showInfo="false" />
    <p>{{ progress.message }}</p>
    <div class="text-right">
      <Button @click="stopPublishing">Stop</Button>
    </div>
  </Modal>
  <Modal :visible="!!progress.result && !isRepositoryMissing" v-bind="modalProps">
    <div v-if="progress.result" class="py-3 px-4">
      <Result
        v-if="progress.result === PublishResults.Success"
        status="success"
        title="Published Successfully"
      >
        <template #subTitle>
          <div v-if="githubInfo">
            Please Check:
            <ul class="text-gray-400 text-left list-disc">
              <li class="mt-2">
                https://github.com/{{ githubInfo.userName }}/{{ repositoryName
                }}{{ githubInfo.branch ? `/tree/${githubInfo.branch}` : '' }}
              </li>
              <li v-if="githubInfo.cname">https://{{ githubInfo.cname }}</li>
              <li v-if="isDefaultRepository && !githubInfo.cname">
                https://{{ githubInfo.userName }}.github.io
              </li>
            </ul>
          </div>
        </template>
        <template #extra>
          <Button @click="reset">Confirm</Button>
        </template>
      </Result>
      <Result v-else status="error" title="Fail to publish">
        <template #subTitle>
          <div :class="{ 'text-left': progress.result === PublishResults.Fail }">
            <p>{{ progress.message }}</p>
            <p v-if="progress.result === PublishResults.Fail">
              Or if you are a Git user, you can use Git manually to continue publishing.
              <a
                href="https://github.com/ylc395/joplin-plugin-pages-publisher/wiki/How-to-use-git-manually"
                target="_blank"
                >See this docs for details</a
              >
            </p>
          </div>
        </template>
        <template #extra>
          <Button @click="reset">Confirm</Button>
          <Button v-if="progress.result === PublishResults.Fail" type="primary" @click="publish()"
            >Retry</Button
          >
        </template>
      </Result>
    </div>
  </Modal>
  <Modal :visible="isRepositoryMissing && !!progress.result" v-bind="modalProps">
    Github Repository <strong>{{ repositoryName }}</strong> doesn't exist. Do you want to create it
    on Github?
    <div class="text-right mt-4">
      <Button class="mr-2" @click="reset">Cancel</Button>
      <Button type="primary" @click="publish(true)">Confirm</Button>
    </div>
  </Modal>
</template>
