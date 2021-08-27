<script lang="ts">
import { defineComponent, provide } from 'vue';
import { Tabs, Button, Modal } from 'ant-design-vue';
import { CloseOutlined, RocketOutlined } from '@ant-design/icons-vue';
import { container } from 'tsyringe';
import ArticleList from './ArticleList/index.vue';
import Site from './Site/index.vue';
import PageList from './PageList/index.vue';
import { ArticleService, token as articleToken } from '../../../domain/service/ArticleService';
import { SiteService, token as siteToken } from '../../../domain/service/SiteService';
import { PageService, token as pageToken } from '../../../domain/service/PageService';
import { NoteService, token as noteToken } from '../../../domain/service/NoteService';
import { ExceptionService } from '../../../domain/service/ExceptionService';
import { selfish, quitApp, generateSite } from '../utils';

export default defineComponent({
  components: {
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
    provide(articleToken, selfish(container.resolve(ArticleService)));
    provide(noteToken, selfish(container.resolve(NoteService)));
    provide(siteToken, selfish(container.resolve(SiteService)));
    provide(pageToken, selfish(container.resolve(PageService)));

    container.resolve(ExceptionService).on('error', (msg) => {
      Modal.error({ content: msg, title: 'Oops!', style: { whiteSpace: 'pre-line' } });
    });

    return { quitApp, generateSite };
  },
});
</script>
<template>
  <Tabs defaultActiveKey="activeKey" size="large">
    <TabPane key="Site" tab="Site" class="panel"><Site /></TabPane>
    <TabPane key="Pages" tab="Pages" class="panel"><PageList /></TabPane>
    <TabPane key="Articles" tab="Articles" class="panel"><ArticleList /></TabPane>
    <template #tabBarExtraContent>
      <Button @click="generateSite">
        <template #icon><RocketOutlined /></template>
        Generate
      </Button>
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
