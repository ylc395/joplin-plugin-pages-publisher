import { compact } from 'lodash';
import { computed, reactive } from 'vue';
import type { Site } from './Site';

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

export const FIELD_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    label: { type: 'string' },
    tip: { type: 'string' },
    required: { type: 'boolean' },
    inputType: {
      enum: [
        'input',
        'select',
        'multiple-select',
        'textarea',
        'radio',
        'switch',
        'image-picker',
        'number',
        'checkbox',
        'date',
      ],
    },
  },
  required: ['name'],
} as const;

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
    private readonly site: Site,
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
    const { themeConfig } = this.site;

    if (!themeConfig) {
      throw new Error('site is not ready when create page');
    }

    return compact([
      this.name === INDEX_PAGE_NAME
        ? null
        : {
            name: 'url',
            defaultValue: this.name,
            placeholder: 'If url is empty, page name will be used as url.',
          },
      ...(themeConfig.pages[this.name] ?? []),
    ]);
  });
}
