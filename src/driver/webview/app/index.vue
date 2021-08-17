<script lang="ts">
import { container } from 'tsyringe';
import { defineComponent, provide } from 'vue';
import { Tabs } from 'ant-design-vue';
import ArticleList from './ArticleList/index.vue';
import Site from './Site/index.vue';
import { ArticleService, token as articleToken } from '../../../domain/service/ArticleService';
import { SiteService, token as siteToken } from '../../../domain/service/SiteService';
import { PageService, token as pageToken } from '../../../domain/service/PageService';
import { selfish } from '../utils';

export default defineComponent({
  components: { Tabs, TabPane: Tabs.TabPane, ArticleList, Site },
  setup() {
    provide(articleToken, selfish(container.resolve(ArticleService)));
    provide(siteToken, selfish(container.resolve(SiteService)));
    provide(pageToken, selfish(container.resolve(PageService)));
  },
});
</script>
<template>
  <Tabs defaultActiveKey="activeKey" size="large">
    <TabPane key="Site" tab="Site" class="panel"><Site /></TabPane>
    <TabPane key="Pages" tab="Pages" class="panel"></TabPane>
    <TabPane key="Articles" tab="Articles" class="panel"><ArticleList /></TabPane>
  </Tabs>
</template>
<style scoped>
:global(:root) {
  overflow: auto;
}

.panel {
  padding: 10px;
}
</style>