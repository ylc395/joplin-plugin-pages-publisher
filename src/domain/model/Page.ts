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

export class Page {
  readonly fieldVars: Vars; // vars provided by fields, which are defined by theme and this plugin. Comes from persistence layer, can be updated by user via fields
  constructor(
    readonly name: string,
    fieldVars: Vars, // vars provided by fields, which are defined by theme and this plugin. Comes from persistence layer, can be updated by user via fields
    private readonly themeConfig: Ref<Theme | null>,
  ) {
    this.fieldVars = reactive(fieldVars);
  }

  url = computed(() => {
    if (this.name === ARTICLE_PAGE_NAME) {
      return `/${this.fieldVars.url || this.name}/:articleUrl`;
    }

    if (this.name === INDEX_PAGE_NAME) {
      return '/';
    }

    return `/${this.fieldVars.url || this.name}`;
  });

  fields = computed<Field[]>(() => {
    if (!this.themeConfig.value) {
      return [];
    }

    return compact([
      this.name === INDEX_PAGE_NAME
        ? null
        : {
            name: 'url',
            defaultValue: this.name,
            placeholder: 'If url is empty, page name will be used as url.',
          },
      ...(this.themeConfig.value.pages[this.name] ?? []),
    ]);
  });
}
