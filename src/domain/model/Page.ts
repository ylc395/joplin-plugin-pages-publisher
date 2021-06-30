import { chunk } from 'lodash';
import slugify from 'slugify';
import { container } from 'tsyringe';
import { computed, reactive, Ref, ref, shallowReactive } from 'vue';
import type { Article } from './Article';
import { token as siteToken } from './Site';

export interface Field {
  name: string;
  label?: string;
  tip?: string;
  defaultValue?: unknown;
  required?: boolean;
  inputType?:
    | 'input'
    | 'select'
    | 'multiple-select'
    | 'textarea'
    | 'radio'
    | 'switch'
    | 'image-picker'
    | 'number';
  options?: Array<{ label: string; value: string; tip?: string }>;
}

const INDEX_PAGE_NAME = 'index';
const ARTICLE_PAGE_NAME = 'article';
const ARCHIVES_PAGE_NAME = 'archives';
const TAG_PAGE_NAME = 'tag';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Env = Record<string, any>;

export abstract class Page {
  readonly site = container.resolve(siteToken);
  abstract readonly pageId: string;
  abstract readonly route: Ref<string>; // url of this page
  abstract readonly defaultVars: Env; // vars provide by this plugin
  abstract readonly defaultFields: Field[]; // fields defined by this plugin
  constructor(
    private readonly themeFields: Field[], // fields defined by theme
    readonly fieldsVars: Env, // vars provided by fields, which are defined by theme and this plugin. Comes from persistence layer, can be updated by user via fields
  ) {}

  get fields() {
    return [...this.defaultFields, ...this.themeFields];
  }
  get vars(): Env {
    return { ...this.defaultVars, ...this.fieldsVars };
  }
}

export class HomePage extends Page {
  static readonly templateName = INDEX_PAGE_NAME;
  readonly pageId = HomePage.templateName;
  readonly route = ref('/');
  readonly defaultVars: Env = shallowReactive({
    site: this.site,
  });
}

export class ArticlePage extends Page {
  static readonly templateName = ARTICLE_PAGE_NAME;
  readonly pageId = `${ArticlePage.templateName}_${this.article.noteId.slice(0, 5)}`;
  private get url() {
    return slugify(this.article.title);
  }
  readonly defaultFields: Field[] = [
    { name: 'url', required: true, defaultValue: this.url },
    { name: 'createdAt', required: true, defaultValue: this.article.createdAt },
    { name: 'updatedAt', required: true, defaultValue: this.article.updatedAt },
    {
      name: 'tags',
      defaultValue: this.article.tags,
      inputType: 'multiple-select',
    },
  ];
  readonly defaultVars: Env = {
    site: this.site,
    article: this.article,
  };
  readonly route = computed(() => {
    const path = [
      encodeURIComponent(this.site.articlePagePrefix.value),
      encodeURIComponent(this.customVars.url),
    ].join('/');

    return `/${path}`;
  });

  constructor(readonly article: Article, customFields: Field[], fieldValues: Env) {
    super(customFields, fieldValues);
  }
}

export class ArchivesPage extends Page {
  static readonly templateName = ARCHIVES_PAGE_NAME;
  readonly pageId = `${ArchivesPage.templateName}_${this.pageNum}`;
  readonly route = computed(() => {
    const path = [
      encodeURIComponent(this.site.archivesPagePrefix.value),
      encodeURIComponent(this.pageNum),
    ].join('/');

    return `/${path}`;
  });
  readonly fields: Field[] = [
    { name: 'articlesCount', label: 'Articles Per Page', defaultValue: 10, inputType: 'number' },
  ];

  readonly defaultVars: Env;

  constructor(readonly pageNum: number, customFields: Field[], fieldValues: Env) {
    super(customFields, fieldValues);

    const articlesChunks = chunk(this.site.articles, this.customVars.articleCount);

    this.defaultVars = {
      site: this.site,
      articles: articlesChunks[this.pageNum],
      pagination: {
        current: this.pageNum,
        next: articlesChunks[this.pageNum + 1] ? this.pageNum + 1 : null,
        prev: this.pageNum === 1 ? null : this.pageNum - 1,
      },
    };
  }
}

export class TagPage extends Page {
  readonly templateName = TAG_PAGE_NAME;
  readonly pageId = `${this.templateName}_${this.tag}`;
  readonly route = computed(() => {
    const path = [
      encodeURIComponent(this.site.tagPagePrefix.value),
      encodeURIComponent(slugify(this.tag)),
    ].join('/');

    return `/${path}`;
  });

  constructor(private readonly tag: string, customFields: Field[], fieldValues: Env) {
    super(customFields, fieldValues);
  }
}

export class CustomPage extends Page {
  readonly pageId = this.templateName;
  readonly route = ref(`/${encodeURIComponent(this.templateName)}`);
  constructor(readonly templateName: string, customFields: Field[], fieldValues: Env) {
    super(customFields, fieldValues);
  }
}
