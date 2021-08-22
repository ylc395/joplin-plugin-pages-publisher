<script lang="ts">
import { defineComponent, inject } from 'vue';
import { startCase } from 'lodash';
import { Button, Modal } from 'ant-design-vue';
import { SettingOutlined } from '@ant-design/icons-vue';
import { token as pageToken } from '../../../../domain/service/PageService';
import { useCustomize } from './useCustomize';
import Customize from './Customize.vue';

export default defineComponent({
  components: { Button, SettingOutlined, Customize, Modal },
  setup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { pages } = inject(pageToken)!;
    const { isCustomizing, customize } = useCustomize();

    return {
      pages,
      startCase,
      isCustomizing,
      customize,
      getModalContainer: () => document.querySelector('#joplin-plugin-content'),
    };
  },
});
</script>
<template>
  <div>
    <div
      v-for="page of pages"
      :key="page.name"
      class="flex justify-between border border-solid border-gray-300 mb-3 py-3 px-4"
    >
      <div>
        <h2 class="font-normal text-base mb-2">{{ startCase(page.name) }} Page</h2>
        <div class="text-gray-500">{{ page.url.value }}</div>
      </div>
      <div class="flex items-center">
        <Button v-if="page.fields.value.length > 0" type="text" @click="customize(page)">
          <template #icon><SettingOutlined /></template>
          Customize
        </Button>
      </div>
    </div>
    <Modal
      v-model:visible="isCustomizing"
      :getContainer="getModalContainer"
      :maskClosable="false"
      :closable="false"
      :footer="null"
    >
      <Customize />
    </Modal>
  </div>
</template>
