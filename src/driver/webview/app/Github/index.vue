<script lang="ts">
import { defineComponent, inject, ref, watchEffect } from 'vue';
import { Form, Input, Alert, Button } from 'ant-design-vue';
import { token } from '../../../../domain/service/PublishService';
import { useDraftForm } from '../../composable/useDraftForm';
import { isEmpty } from 'lodash';

export default defineComponent({
  components: { Form, FormItem: Form.Item, Input, Alert, Button },
  setup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { githubInfo, saveGithubInfo } = inject(token)!;
    const { modelRef, validateInfos, save, canSave, validate } = useDraftForm(
      githubInfo,
      saveGithubInfo,
      ref({
        userName: [{ required: true }],
        repositoryName: [{ required: true }],
        email: [{ required: true, type: 'email' }],
      }),
    );

    // todo: github info's first validating doesn't work. see https://github.com/vueComponent/ant-design-vue/pull/4646/
    // when merged, remove following code
    let validated = false;
    const stopValidate = watchEffect(() => {
      if (validated) {
        stopValidate();
        return;
      }
      if (!isEmpty(modelRef.value) && !validated) {
        validated = true;
        validate();
      }
    });

    return { modelRef, validateInfos, save, canSave, githubInfo };
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
    <Form :labelCol="{ span: 4 }">
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
        <Input v-model:value="modelRef.branch" placeholder="Default value is main" />
      </FormItem>
    </Form>
    <div class="text-right">
      <Button type="primary" :disabled="!canSave" @click="save">Save</Button>
    </div>
  </div>
</template>
