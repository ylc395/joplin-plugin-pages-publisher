<script lang="ts">
import { defineComponent, inject } from 'vue';
import { token as diffToken } from './useDiff';

export default defineComponent({
  setup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { diffInfo } = inject(diffToken)!;

    return { diffInfo };
  },
});
</script>
<template>
  <article class="whitespace-pre-line">
    <template v-for="(block, index) of diffInfo" :key="index">
      <span v-if="block.added" class="text-green-500 bg-green-200">{{ block.value }}</span>
      <span v-else-if="block.removed" class="text-red-500 bg-red-300">{{ block.value }}</span>
      <template v-else>{{ block.value }}</template>
    </template>
  </article>
</template>
