<script lang="ts">
import { defineComponent, inject, ref, watchEffect, computed } from 'vue';
import { Form, Input, Alert, Button } from 'ant-design-vue';
import { token as publishToken } from '../../../../domain/service/PublishService';
import { token as appToken, FORBIDDEN } from '../../../../domain/service/AppService';
import { useDraftForm } from '../../composable/useDraftForm';

export default defineComponent({
  components: { Form, FormItem: Form.Item, Input, Alert, Button },
  setup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { githubInfo, saveGithubInfo } = inject(publishToken)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { setWarning, getLatestWarning } = inject(appToken)!;
    const { modelRef, validateInfos, save, canSave, isModified, resetFields } = useDraftForm(
      githubInfo,
      saveGithubInfo,
      ref({
        userName: [{ required: true }],
        repositoryName: [{ required: true }],
        email: [{ required: true, type: 'email' }],
      }),
    );

    const MODIFICATION_WARNING = 'Github modification has not been saved.';

    watchEffect(() => {
      setWarning(FORBIDDEN.TAB_SWITCH, MODIFICATION_WARNING, isModified.value);
      setWarning(FORBIDDEN.GENERATE, MODIFICATION_WARNING, isModified.value);
    });

    return {
      modelRef,
      validateInfos,
      save,
      canSave,
      githubInfo,
      resetFields,
      isModified,
      warningForGenerating: computed(() => getLatestWarning(FORBIDDEN.GENERATE)),
      warningForTabSwitching: computed(() => getLatestWarning(FORBIDDEN.TAB_SWITCH)),
    };
  },
});
</script>
<template>
  <div class="px-6">
    <Alert v-if="githubInfo && !githubInfo.token" banner class="mb-4">
      <template #message
        >Github token has not been set yet, so we can't push pages to Github. For security, please
        set Github token on Joplin Setting Panel. See this
        <a
          target="_blank"
          href="https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token"
          >Github Help Doc</a
        >
        for details.
      </template>
    </Alert>
    <Form :labelCol="{ span: 6 }">
      <FormItem label="User Name" v-bind="validateInfos.userName">
        <Input v-model:value="modelRef.userName" />
      </FormItem>
      <FormItem label="Email" v-bind="validateInfos.email">
        <Input v-model:value="modelRef.email" />
      </FormItem>
      <FormItem label="Repository Name" v-bind="validateInfos.repositoryName">
        <Input v-model:value="modelRef.repositoryName" />
      </FormItem>
      <FormItem label="Branch">
        <Input v-model:value="modelRef.branch" placeholder="Default value is master" />
      </FormItem>
    </Form>
    <div class="text-right">
      <Button v-if="isModified" class="mr-3" @click="resetFields">Reset</Button>
      <Button type="primary" :disabled="!canSave" @click="save">Save</Button>
    </div>
  </div>
</template>
