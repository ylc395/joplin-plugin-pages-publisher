<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Modal, Result, Button } from 'ant-design-vue';
import { token as previewToken } from 'domain/service/PreviewService';
import { token as publishToken } from 'domain/service/PublishService';
import { useModalProps } from './composable';

export default defineComponent({
  components: { Modal, Result, Button },
  setup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { publish } = inject(publishToken)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { startPreviewing, port, message, reset } = inject(previewToken)!;

    return {
      modalProps: useModalProps(),
      startPreviewing,
      port,
      message,
      publish: () => {
        reset();
        publish();
      },
      reset,
    };
  },
});
</script>
<template>
  <Modal :visible="Boolean(port || message)" v-bind="modalProps">
    <Result
      class="py-3 px-4"
      :status="port ? 'success' : 'error'"
      :title="port ? 'Local Server has been started' : 'Unexpected Failure'"
    >
      <template #subTitle>
        <div v-if="port">
          You can preview your website in <strong>http://localhost:{{ port }}</strong>
        </div>
        <div v-else class="text-left whitespace-pre-line">
          {{ message }}
        </div>
      </template>
      <template #extra>
        <Button @click="reset">Confirm</Button>
        <Button v-if="port" type="primary" @click="publish">Publish</Button>
      </template>
    </Result>
  </Modal>
</template>
