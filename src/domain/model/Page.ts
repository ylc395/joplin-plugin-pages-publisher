import { compact } from 'lodash';
import { computed, reactive, Ref } from 'vue';
import type { Theme } from './Theme';

export interface Field {
  readonly name: string;
  readonly label?: string;
  readonly tip?: string;
  readonly placeholder?: string;
  readonly defaultValue?: unknown;
  readonly rules?: Record<string, unknown>[];
  readonly inputType?:
    | 'input'
    | 'select'
    | 'multiple-select'
    | 'textarea'
    | 'radio'
    | 'checkbox'
    | 'date'
    | 'switch'
    | 'image-picker'
    | 'number';
  readonly options?: Array<Readonly<{ label: string; value: string; tip?: string }>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Vars = Record<string, any>;

// page with these names will be handled in some special ways
export const INDEX_PAGE_NAME = 'index';
export const ARTICLE_PAGE_NAME = 'article';

export const PREDEFINED_FIELDS: Record<string, Field[] | undefined> = {
  [ARTICLE_PAGE_NAME]: [
    {
      name: 'dateFormat',
      label: 'Date Format',
      defaultValue: 'YYYY-MM-DD HH:mm',
      placeholder: 'Default value is YYYY-MM-DD HH:mm.',
      tip: 'See <a href="https://momentjs.com/docs/#/displaying/">moment.js document.</a>',
    },
  ],
};

export class Page {
  readonly fieldVars: Vars; // vars provided by fields, which are defined by theme and this plugin. Comes from persistence layer, can be updated by user via fields
  constructor(
    readonly name: string,
    fieldVars: Vars, // vars provided by fields, which are defined by theme and this plugin. Comes from persistence layer, can be updated by user via fields
    private readonly themeConfig: Ref<Theme | null>,
  ) {
    this.fieldVars = reactive(fieldVars);
  }

  readonly isArticlePage = this.name === ARTICLE_PAGE_NAME;

  readonly url = computed(() => {
    if (this.name === INDEX_PAGE_NAME) {
      return '/';
    }

    return `/${this.fieldVars.url || this.name}`;
  });

  readonly fields = computed<Field[]>(() => {
    if (!this.themeConfig.value) {
      return [];
    }

    return compact([
      this.name === INDEX_PAGE_NAME
        ? null
        : {
            name: 'url',
            label: 'Url',
            defaultValue: this.name,
            placeholder: 'Default value is the name of this page.',
          },
      ...(PREDEFINED_FIELDS[this.name] || []),
      ...(this.themeConfig.value.pages[this.name] ?? []),
    ]);
  });
}
