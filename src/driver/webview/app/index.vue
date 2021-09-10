<script lang="ts">
import { defineComponent, provide } from 'vue';
import { Tabs, Button, Tooltip } from 'ant-design-vue';
import { CloseOutlined, RocketOutlined } from '@ant-design/icons-vue';
import { container } from 'tsyringe';
import ArticleList from './ArticleList/index.vue';
import Site from './Site/index.vue';
import PageList from './PageList/index.vue';
import { ArticleService, token as articleToken } from '../../../domain/service/ArticleService';
import { SiteService, token as siteToken } from '../../../domain/service/SiteService';
import { PageService, token as pageToken } from '../../../domain/service/PageService';
import { NoteService, token as noteToken } from '../../../domain/service/NoteService';
import { PublishService, token as publishToken } from '../../../domain/service/PublishService';
import { AppService, token as appToken } from '../../../domain/service/AppService';
import { selfish } from '../utils';
import { useActiveTabPane } from './useTabPane';

export default defineComponent({
  components: {
    Tooltip,
    Tabs,
    TabPane: Tabs.TabPane,
    CloseOutlined,
    RocketOutlined,
    Button,
    ArticleList,
    Site,
    PageList,
  },
  setup() {
    const publishService = selfish(container.resolve(PublishService));
    const appService = selfish(container.resolve(AppService));

    provide(articleToken, selfish(container.resolve(ArticleService)));
    provide(noteToken, selfish(container.resolve(NoteService)));
    provide(siteToken, selfish(container.resolve(SiteService)));
    provide(pageToken, selfish(container.resolve(PageService)));
    provide(publishToken, publishService);
    provide(appToken, appService);

    const { isGenerating, generateSite, gitPush } = publishService;
    const {
      app: { quit: quitApp },
      isAppBlocked,
      appBlockInfo,
    } = appService;

    return {
      quitApp,
      generateSite,
      isGenerating,
      gitPush,
      activeKey: useActiveTabPane(appService),
      isAppBlocked,
      appBlockInfo,
    };
  },
});
</script>
<template>
  <Tabs v-model:activeKey="activeKey" size="large">
    <TabPane key="Site" tab="Site" class="panel"><Site /></TabPane>
    <TabPane key="Pages" tab="Pages" class="panel"><PageList /></TabPane>
    <TabPane key="Articles" tab="Articles" class="panel"><ArticleList /></TabPane>
    <template #tabBarExtraContent>
      <Tooltip :title="appBlockInfo">
        <Button :loading="isGenerating" :disabled="isAppBlocked" @click="generateSite">
          <template #icon><RocketOutlined /></template>
          Generate
        </Button>
      </Tooltip>
      <Button @click="gitPush"> Push </Button>
      <Button class="border-0 mr-4" @click="quitApp">
        <template #icon><CloseOutlined /></template>
      </Button>
    </template>
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
