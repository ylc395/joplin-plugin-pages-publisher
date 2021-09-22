import { compact, map, filter, startCase } from 'lodash';
import { computed, reactive } from 'vue';
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
    | 'markdown'
    | 'menu'
    | 'number';

  // valid when inputType is select, multiple-select, radio, checkbox
  readonly options?: Array<Readonly<{ label: string; value: string }>>;
}

export type Menu = Array<{
  label: string;
  link: string;
}>;

export type PageValues = Record<string, unknown>;

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
  readonly values: PageValues; // provided by fields, which are defined by theme and this plugin. Comes from persistence layer, can be updated by user via fields

  readonly fields = compact([
    this.name === INDEX_PAGE_NAME
      ? null
      : {
          name: 'url',
          label: 'Url',
          placeholder: `Default value is ${this.name}`,
        },
    ...(PREDEFINED_FIELDS[this.name] || []),
    ...(this.themeConfig.pages[this.name] ?? []),
  ]);

  readonly isArticlePage = this.name === ARTICLE_PAGE_NAME;

  constructor(
    readonly name: string,
    values: PageValues, // provided by fields, which are defined by theme and this plugin. Comes from persistence layer, can be updated by user via fields
    private readonly themeConfig: Theme,
  ) {
    this.values = reactive({
      ...this.fields.reduce((result, filed) => {
        result[filed.name] = null;
        return result;
      }, {} as PageValues),
      ...values,
    });
  }

  get readableName() {
    return `${startCase(this.name)} Page`;
  }

  readonly url = computed(() => {
    if (this.name === INDEX_PAGE_NAME) {
      return '/';
    }

    return `/${this.values.url || this.name}`;
  });

  static getMarkdownFieldNames(field: Field[]) {
    return map(filter(field, { inputType: 'markdown' }), 'name');
  }
}
