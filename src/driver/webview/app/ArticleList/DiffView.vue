<script lang="ts">
import { defineComponent, inject } from 'vue';
import { Alert } from 'ant-design-vue';
import { token as diffToken } from './useDiff';

export default defineComponent({
  components: { Alert },
  setup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { diffInfo } = inject(diffToken)!;

    return { diffInfo };
  },
});
</script>
<template>
  <Alert
    type="info"
    message="Green parts mean the content only existed in your edited article, but not in origin Joplin note. Red parts are the opposite."
    class="mb-2 mt-6"
  />
  <article class="whitespace-pre-line">
    <template v-for="(block, index) of diffInfo" :key="index">
      <span v-if="block.added" class="text-green-500 bg-green-100">{{ block.value }}</span>
      <span v-else-if="block.removed" class="text-red-500 bg-red-100 line-through">{{
        block.value
      }}</span>
      <template v-else>{{ block.value }}</template>
    </template>
  </article>
</template>
