<script lang="ts">
import { defineComponent, provide } from 'vue';
import { Tabs } from 'ant-design-vue';
import ArticleList from './Panels/ArticleList/index.vue';
import { ArticleService, token } from '../../domain/ArticleService';

function selfish<T>(target: T) {
  const cache = new WeakMap();
  return new Proxy(target as never, {
    get(target, key) {
      const value = Reflect.get(target, key);
      if (typeof value !== 'function') {
        return value;
      }
      if (!cache.has(value)) {
        cache.set(value, value.bind(target));
      }
      return cache.get(value);
    },
  }) as T;
}

export default defineComponent({
  components: { Tabs, TabPane: Tabs.TabPane, ArticleList },
  setup() {
    provide(token, selfish(new ArticleService()));
  },
});
</script>
<template>
  <Tabs defaultActiveKey="activeKey" size="large">
    <TabPane key="Articles" tab="Articles" class="panel"
      ><ArticleList
    /></TabPane>
    <TabPane key="Pages" tab="Pages" class="panel"></TabPane>
  </Tabs>
</template>
<style scoped>
.panel {
  padding: 10px;
}
</style>
