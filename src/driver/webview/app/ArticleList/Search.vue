<script lang="ts">
import { defineComponent, inject, ref } from 'vue';
import { debounce } from 'lodash';
import { Select, Button, Tag } from 'ant-design-vue';
import { token } from 'domain/service/NoteService';

export default defineComponent({
  components: {
    Select,
    SelectOption: Select.Option,
    Tag,
    Button,
  },
  emits: ['submit'],
  setup(_, { emit }) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { searchedNotes, searchNotes, addNote, removeNote, submitAsArticles } = inject(token)!;
    const selectedNoteIds = ref<string[]>([]);
    const submit = async () => {
      await submitAsArticles();
      selectedNoteIds.value = [];
      emit('submit');
    };

    return {
      submit,
      selectedNoteIds,
      searchedNotes,
      addNote,
      removeNote,
      submitAsArticles,
      searchNotes: debounce(searchNotes, 500),
    };
  },
});
</script>
<template>
  <div>
    <Select
      v-model:value="selectedNoteIds"
      class="flex-grow mr-3"
      size="large"
      placeholder="Search notes to add"
      mode="multiple"
      :filterOption="false"
      @search="searchNotes"
      @select="addNote"
      @deselect="removeNote"
    >
      <!-- todo: if title is very long, tag will cover and extend whole line -->
      <SelectOption v-for="note of searchedNotes" :key="note.id" :disabled="note.status !== 'none'">
        {{ note.title }}
        <Tag
          v-if="note.status !== 'none'"
          :color="note.status === 'unpublished' ? 'processing' : 'success'"
          >{{ note.status }}</Tag
        >
      </SelectOption>
    </Select>
    <Button
      :disabled="selectedNoteIds.length === 0"
      type="primary"
      size="large"
      class="mr-2"
      @click="submit"
    >
      Add
    </Button>
  </div>
</template>
