<script lang="ts">
import { defineComponent, inject, provide } from 'vue';
import { Form, Select, Button, InputNumber, Switch, Upload, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { token as siteToken } from 'domain/service/SiteService';
import { useDraftForm } from '../../composable/useDraftForm';
import FieldForm from '../../components/FieldForm/index.vue';
import { token as formToken } from '../../components/FieldForm/useFieldForm';
import {
  useSiteEdit,
  useCustomFieldModel,
  useCustomFieldValidateInfo,
  useAppWarning,
  useTheme,
  useIcon,
  useGuideModal,
} from './composable';

export default defineComponent({
  components: {
    Form,
    FormItem: Form.Item,
    Select,
    SelectOption: Select.Option,
    Switch,
    Button,
    InputNumber,
    Upload,
    PlusOutlined,
    Modal,
    FieldForm,
  },
  setup() {
    const { site, themes, saveSite } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      inject(siteToken)!;

    const { customFieldRules, customFields, customEqual } = useSiteEdit();

    const { modelRef, validateInfos, save, canSave, isModified, isValid, resetFields } =
      useDraftForm(
        site,
        saveSite,
        (data) => ({
          themeName: [{ required: true }],
          feedEnabled: [{ required: true }],
          feedLength: [{ required: data.feedEnabled }],
          ...customFieldRules.value,
        }),
        customEqual,
      );

    useAppWarning(isModified, isValid);
    const { handleSelect, selectedThemeName, resetAndLoadTheme } = useTheme(modelRef, resetFields);
    const { fileList, upload: uploadIcon, remove: removeIcon } = useIcon(modelRef);
    const { modalVisible, dataDir } = useGuideModal();

    provide(formToken, {
      model: useCustomFieldModel(modelRef),
      validateInfos: useCustomFieldValidateInfo(customFieldRules, validateInfos),
      fields: customFields,
    });

    return {
      themes,
      validateInfos,
      modelRef,
      save,
      canSave,
      customFields,
      handleSelect,
      selectedThemeName,
      isModified,
      resetAndLoadTheme,
      fileList,
      uploadIcon,
      removeIcon,
      modalVisible,
      dataDir,
    };
  },
});
</script>
<template>
  <div class="px-6">
    <h2 class="text-gray-400">General Configuration</h2>
    <Form :labelCol="{ span: 4 }">
      <FormItem label="Theme" v-bind="validateInfos.themeName">
        <Select :value="selectedThemeName" @change="handleSelect">
          <SelectOption v-for="{ name } of themes" :key="name">{{ name }}</SelectOption>
        </Select>
        <a @click="modalVisible = true">How to make custom theme?</a>
      </FormItem>
      <FormItem label="Icon" extra="choose a .ico file as site icon">
        <Upload
          listType="picture-card"
          accept=".ico"
          :showUploadList="{ showPreviewIcon: false }"
          :beforeUpload="uploadIcon"
          :remove="removeIcon"
          :fileList="fileList"
        >
          <div v-if="fileList.length === 0">
            <PlusOutlined />
            <div class="ant-upload-text">Upload</div>
          </div>
        </Upload>
      </FormItem>
      <FormItem label="Feed" extra="Whether to enable RSS Feed">
        <Switch v-model:checked="modelRef.feedEnabled" />
      </FormItem>
      <FormItem v-if="modelRef.feedEnabled" label="Feed Length">
        <InputNumber v-model:value="modelRef.feedLength" :min="1" />
      </FormItem>
    </Form>
    <template v-if="customFields.length > 0" class="mt-10">
      <h2 class="text-gray-400">Theme Customized Configuration</h2>
      <FieldForm />
    </template>
    <div class="text-right">
      <Button v-if="isModified" class="mr-3" @click="resetAndLoadTheme">Reset</Button>
      <Button type="primary" :disabled="!canSave" @click="save">Save</Button>
    </div>
  </div>
  <Modal v-model:visible="modalVisible" :width="400" :closable="false">
    <p>
      Put theme directory under <strong>{{ dataDir }}/themes</strong>
    </p>
    <p>
      See
      <a
        href="https://github.com/ylc395/joplin-plugin-page-publisher/blob/master/docs/how-to-make-a-custom-theme.md"
        target="_blank"
        >this doc</a
      >
      for details.
    </p>
    <template #footer>
      <Button @click="modalVisible = false">Confirm</Button>
    </template>
  </Modal>
</template>
