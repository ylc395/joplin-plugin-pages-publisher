<script lang="ts">
import { defineComponent, inject, ref } from 'vue';
import { token as appToken } from 'domain/service/AppService';
import { Modal, Button } from 'ant-design-vue';
import { FOCUSING_MODAL } from 'driver/webview/utils/webviewApi';

export default defineComponent({
  components: { Modal, Button },
  setup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { isNewUser } = inject(appToken)!;
    const isShowing = ref(true);

    return { isNewUser, FOCUSING_MODAL, isShowing };
  },
});
</script>

<template>
  <Modal :visible="isNewUser && isShowing" v-bind="FOCUSING_MODAL" title="Welcome!">
    It seems that this is your first time of using this plugin. Recommend strongly to read a
    <strong>very short and simple User Guide</strong> in
    <a
      target="_blank"
      href="https://github.com/ylc395/joplin-plugin-pages-publisher/wiki/User-Guide"
      >https://github.com/ylc395/joplin-plugin-pages-publisher/wiki/User-Guide</a
    >
    <div class="text-right">
      <Button type="primary" @click="isShowing = false">Confirm</Button>
    </div>
  </Modal>
</template>
