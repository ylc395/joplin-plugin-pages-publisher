<script lang="ts">
import { defineComponent, inject } from 'vue';
import { List } from 'ant-design-vue';
import { token } from '../../../domain/service/PageService';

export default defineComponent({
  components: {
    List,
    ListItem: List.Item,
    ListItemMeta: List.Item.Meta,
  },
  setup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { pageSingletons: pages } = inject(token)!;

    return { pages };
  },
});
</script>
<template>
  <List :dataSource="pages">
    <template #renderItem="{ item }">
      <ListItem>
        <ListItemMeta :title="item.pageId" :description="item.route" />
      </ListItem>
    </template>
  </List>
</template>
