import { chunk } from 'lodash';
import slugify from 'slugify';
import { computed, readonly, Ref, ref } from 'vue';
import type { Article } from './Article';
import type { Site } from './Site';

export interface Field {
  readonly name: string;
  readonly label?: string;
  readonly tip?: string;
  readonly defaultValue?: unknown;
  readonly required?: boolean;
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

const INDEX_PAGE_NAME = 'index';
const ARTICLE_PAGE_NAME = 'article';
const ARCHIVES_PAGE_NAME = 'archives';
const TAG_PAGE_NAME = 'tag';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Vars = Record<string, any>;

export abstract class Page {
  abstract readonly pageId: string;
  abstract readonly route: Ref<string>; // url of this page
  protected abstract readonly defaultFields: Readonly<Field[]>;
  protected abstract readonly defaultVars: Readonly<Vars>; // vars provide by this plugin. can not be updated by user
  constructor(
    protected readonly site: Site,
    readonly fieldVars: Vars, // vars provided by fields, which are defined by theme and this plugin. Comes from persistence layer, can be updated by user via fields
  ) {}

  get fields() {
    const { themeConfig } = this.site;

    if (!themeConfig) {
      throw new Error('Pass a initialized site before getting fields');
    }

    return [...this.defaultFields, ...(themeConfig.pages[this.pageId] ?? [])];
  }

  get vars(): Vars {
    return { site: this.site, page: { ...this.fieldVars, ...this.defaultVars } };
  }
}

export class HomePage extends Page {
  static readonly pageName = INDEX_PAGE_NAME;
  readonly pageId = HomePage.pageName;
  readonly route = readonly(ref('/'));
  protected readonly defaultFields = [] as const;
  protected readonly defaultVars: Vars = {};
}

export class ArticlePage extends Page {
  static readonly pageName = ARTICLE_PAGE_NAME;
  readonly pageId = this.article ? ArticlePage.getPageId(this.article) : ArticlePage.pageName;
  protected readonly defaultFields = [
    {
      name: 'url',
      defaultValue: 'article',
      required: true,
    },
  ] as const;
  readonly defaultVars: Vars = {
    article: this.article,
  };
  readonly route = ref<string>(this.fieldVars.url);

  constructor(site: Site, fieldVars: Vars, readonly article?: Article) {
    super(site, fieldVars);
  }

  static getPageId(article: Article) {
    return `${ArticlePage.pageName}_${article.noteId.slice(0, 5)}`;
  }
}

export class ArchivesPage extends Page {
  static readonly pageName = ARCHIVES_PAGE_NAME;
  static readonly defaultArticlesCount = 10;
  readonly pageId = this.pageNum
    ? `${ArchivesPage.pageName}_${this.pageNum}`
    : ArchivesPage.pageName;
  readonly route = ref<string>(this.fieldVars.url);
  protected readonly defaultFields = [
    {
      name: 'articlesCount',
      label: 'Articles Per Page',
      defaultValue: ArchivesPage.defaultArticlesCount,
      inputType: 'number',
      required: true,
    },
    {
      name: 'url',
      defaultValue: 'archives',
      required: true,
    },
  ] as const;

  protected get defaultVars() {
    if (!this.pageNum) {
      return {};
    }

    const articlesChunks = chunk(this.site.articles, this.fieldVars.value.articleCount);

    return {
      current: this.pageNum,
      next: articlesChunks[this.pageNum + 1] ? this.pageNum + 1 : null,
      prev: this.pageNum === 1 ? null : this.pageNum - 1,
    } as const;
  }

  constructor(site: Site, fieldVars: Vars, readonly pageNum?: number) {
    super(site, fieldVars);
  }
}

export class TagPage extends Page {
  static readonly pageName = TAG_PAGE_NAME;
  readonly pageId = this.tag ? `${TagPage.pageName}_${this.tag}` : TagPage.pageName;
  readonly route = computed(() => {
    const path = [
      encodeURIComponent(this.fieldVars.url),
      this.tag ? encodeURIComponent(slugify(this.tag)) : ':tag',
    ].join('/');

    return `/${path}`;
  });

  protected readonly defaultVars = {
    tag: this.tag,
  } as const;

  protected readonly defaultFields = [
    {
      name: 'url',
      defaultValue: 'archives',
      required: true,
    },
  ] as const;
  constructor(site: Site, fieldVars: Vars, private readonly tag?: string) {
    super(site, fieldVars);
  }
}

export class CustomPage extends Page {
  protected readonly defaultFields = [
    {
      name: 'url',
      defaultValue: 'archives',
      required: true,
    },
  ] as const;
  protected readonly defaultVars = {} as const;
  readonly pageId = this.pageName;
  readonly route = computed(() => `/${encodeURIComponent(this.fieldVars.url || this.pageName)}`);
  constructor(private readonly pageName: string, site: Site, fieldVars: Vars) {
    super(site, fieldVars);
  }
}
