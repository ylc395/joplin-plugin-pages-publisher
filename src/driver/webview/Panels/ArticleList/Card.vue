<script lang="ts">
import { defineComponent } from 'vue';
import { Card } from "ant-design-vue";

export default defineComponent({
  components: {Card},
  props: { article: { required: true, type: Object } },
});
</script>
<template>
  <Card :title="article.title"> 
    {{}}
  <Card />
</template>
