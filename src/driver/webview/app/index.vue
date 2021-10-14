<script lang="ts">
import { defineComponent, provide, computed } from 'vue';
import { Tabs, Button, Tooltip } from 'ant-design-vue';
import {
  CloseOutlined,
  RocketOutlined,
  HomeOutlined,
  BuildOutlined,
  ContainerOutlined,
  GithubOutlined,
} from '@ant-design/icons-vue';
import { container } from 'tsyringe';

import { ArticleService, token as articleToken } from 'domain/service/ArticleService';
import { SiteService, token as siteToken } from 'domain/service/SiteService';
import { PageService, token as pageToken } from 'domain/service/PageService';
import { NoteService, token as noteToken } from 'domain/service/NoteService';
import { PublishService, token as publishToken } from 'domain/service/PublishService';
import { AppService, token as appToken, FORBIDDEN } from 'domain/service/AppService';

import ArticleList from './ArticleList/index.vue';
import Site from './Site/index.vue';
import PageList from './PageList/index.vue';
import Github from './Github/index.vue';
import Publisher from './Publisher/index.vue';
import { selfish } from '../utils';
import { useActiveTabPane } from './composable';

export default defineComponent({
  components: {
    Tooltip,
    Tabs,
    TabPane: Tabs.TabPane,
    CloseOutlined,
    RocketOutlined,
    HomeOutlined,
    BuildOutlined,
    ContainerOutlined,
    GithubOutlined,
    Button,
    ArticleList,
    Site,
    PageList,
    Github,
    Publisher,
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

    const { generateSite } = publishService;
    const { getLatestWarning, quitApp, showingQuitButton } = appService;

    return {
      quitApp,
      generateSite,
      showingQuitButton,
      activeKey: useActiveTabPane(appService),
      warningForGenerating: computed(() => getLatestWarning(FORBIDDEN.GENERATE)),
      warningForTabSwitching: computed(() => getLatestWarning(FORBIDDEN.TAB_SWITCH)),
    };
  },
});
</script>
<template>
  <Tabs v-model:activeKey="activeKey">
    <TabPane key="Site">
      <template #tab><HomeOutlined />Site</template>
      <Site />
    </TabPane>
    <TabPane key="Pages">
      <template #tab><BuildOutlined />Pages</template>
      <PageList />
    </TabPane>
    <TabPane key="Articles">
      <template #tab><ContainerOutlined />Articles</template>
      <ArticleList />
    </TabPane>
    <TabPane key="Github">
      <template #tab><GithubOutlined />Github</template>
      <Github />
    </TabPane>
    <template #tabBarExtraContent>
      <Tooltip :title="warningForGenerating">
        <Button class="mr-2" :disabled="!!warningForGenerating" @click="generateSite">
          <template #icon><RocketOutlined /></template>
          Generate
        </Button>
      </Tooltip>
      <Button v-if="showingQuitButton" class="mr-4" @click="quitApp">
        <template #icon><CloseOutlined /></template>
        Quit
      </Button>
    </template>
  </Tabs>
  <Publisher />
</template>
<style scoped>
:global(:root) {
  overflow: auto;
}

:global(.anticon) {
  vertical-align: 0.125em;
}

.ant-tabs {
  overflow: auto;
}

:deep(.ant-tabs-nav .ant-tabs-tab) {
  margin-right: 16px;
}

.ant-tabs-tabpane {
  padding: 10px;
}
</style>
