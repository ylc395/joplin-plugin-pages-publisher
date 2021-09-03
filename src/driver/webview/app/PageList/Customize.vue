<script lang="ts">
import { defineComponent, inject, provide } from 'vue';
import { Button } from 'ant-design-vue';
import { token as customizeToken } from './useCustomize';
import { useDraftForm } from '../../composable/useDraftForm';
import Form from '../../components/FieldForm/index.vue';
import { token } from '../../components/FieldForm/useFieldForm';

export default defineComponent({
  components: {
    Button,
    Form,
  },
  setup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { fields, filedVars, savePage, stopCustomize, rules } = inject(customizeToken)!;
    const { save, canSave, modelRef, validateInfos } = useDraftForm(filedVars, savePage, rules);

    provide(token, { fields, validateInfos, model: modelRef });

    return { save, canSave, stopCustomize };
  },
});
</script>

<template>
  <Form />
  <div class="text-right">
    <Button type="primary" class="mr-2" :disabled="!canSave" @click="save">Save</Button>
    <Button @click="stopCustomize">Cancel</Button>
  </div>
</template>
