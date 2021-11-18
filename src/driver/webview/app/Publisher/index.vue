<script lang="ts">
import { defineComponent } from 'vue';
import GeneratingModal from './GeneratingModal.vue';
import PublishingModal from './PublishingModal.vue';
import PreviewModal from './PreviewModal.vue';

export default defineComponent({
  components: { GeneratingModal, PublishingModal, PreviewModal },
});
</script>
<template>
  <GeneratingModal />
  <PublishingModal />
  <PreviewModal />
</template>
