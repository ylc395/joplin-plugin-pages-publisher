<script lang="ts">
import { defineComponent } from 'vue';
import GeneratingModal from './GeneratingModal.vue';
import PublishingModal from './PublishingModal.vue';

export default defineComponent({
  components: { GeneratingModal, PublishingModal },
});
</script>
<template>
  <GeneratingModal />
  <PublishingModal />
</template>
