import { chunk } from 'lodash';
import slugify from 'slugify';
import { computed, reactive, readonly, Ref, ref } from 'vue';
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
    | 'switch'
    | 'image-picker'
    | 'number';
  readonly options?: Array<Readonly<{ label: string; value: string; tip?: string }>>;
}

const INDEX_PAGE_NAME = 'index';
const ARTICLE_PAGE_NAME = 'article';
const ARCHIVES_PAGE_NAME = 'archives';
const TAG_PAGE_NAME = 'tag';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Vars = Record<string, any>;

export abstract class Page {
  abstract readonly pageId: string;
  abstract readonly route: Ref<string>; // url of this page
  protected abstract readonly defaultVars: Readonly<Vars>; // vars provide by this plugin
  readonly fieldVars: Vars; // vars provided by fields, which are defined by theme and this plugin. Comes from persistence layer, can be updated by user via fields
  protected abstract readonly defaultFields: Readonly<Field[]>; // fields defined by this plugin
  constructor(
    protected readonly site: Required<Site>,
    private readonly themeFields?: Readonly<Field[]>, // fields defined by theme
  ) {
    this.site = reactive(site);

    const vars: Vars = {};

    if (themeFields) {
      for (const { name, defaultValue } of this.fields) {
        vars[name] = defaultValue;
      }
    }

    this.fieldVars = reactive(vars);
  }

  get fields() {
    if (!this.themeFields) {
      throw new Error('can not get fields, because themeFields is not provided');
    }

    return [...this.defaultFields, ...this.themeFields];
  }

  get vars(): Vars {
    return { ...this.defaultVars, ...this.fieldVars };
  }

  setFieldVars(vars: Vars) {
    Object.assign(this.fieldVars, vars);
  }
}

export class HomePage extends Page {
  static readonly pageName = INDEX_PAGE_NAME;
  readonly pageId = HomePage.pageName;
  readonly route = readonly(ref('/'));
  protected readonly defaultFields = [] as const;
  protected readonly defaultVars: Vars = {
    site: this.site,
  };
}

export class ArticlePage extends Page {
  static readonly pageName = ARTICLE_PAGE_NAME;
  readonly pageId = `${ArticlePage.pageName}_${this.article.noteId.slice(0, 5)}`;
  readonly defaultFields = [
    { name: 'url', required: true, defaultValue: slugify(this.article.title) },
    { name: 'createdAt', required: true, defaultValue: this.article.createdAt },
    { name: 'updatedAt', required: true, defaultValue: this.article.updatedAt },
    {
      name: 'tags',
      defaultValue: this.article.tags,
      inputType: 'multiple-select',
    },
  ] as const;
  readonly defaultVars: Vars = {
    site: this.site,
    article: this.article,
  };
  readonly route = computed(() => {
    const path = [
      encodeURIComponent(this.site.articlePagePrefix),
      encodeURIComponent(this.fieldVars.url),
    ].join('/');

    return `/${path}`;
  });

  constructor(readonly article: Article, site: Required<Site>, themeFields?: Field[]) {
    super(site, themeFields);
  }
}

export class ArchivesPage extends Page {
  static readonly pageName = ARCHIVES_PAGE_NAME;
  readonly pageId = `${ArchivesPage.pageName}_${this.pageNum}`;
  readonly route = computed(() => {
    const path = [
      encodeURIComponent(this.site.archivesPagePrefix),
      encodeURIComponent(this.pageNum),
    ].join('/');

    return `/${path}`;
  });
  protected readonly defaultFields = [
    { name: 'articlesCount', label: 'Articles Per Page', defaultValue: 10, inputType: 'number' },
  ] as const;

  protected get defaultVars() {
    const articlesChunks = chunk(this.site.articles, this.fieldVars.articleCount);

    return {
      site: this.site,
      articles: articlesChunks[this.pageNum],
      pagination: {
        current: this.pageNum,
        next: articlesChunks[this.pageNum + 1] ? this.pageNum + 1 : null,
        prev: this.pageNum === 1 ? null : this.pageNum - 1,
      },
    } as const;
  }

  constructor(readonly pageNum: number, site: Required<Site>, themeFields?: Field[]) {
    super(site, themeFields);
  }
}

export class TagPage extends Page {
  static readonly pageName = TAG_PAGE_NAME;
  readonly pageId = `${TagPage.pageName}_${this.tag}`;
  readonly route = computed(() => {
    const path = [
      encodeURIComponent(this.site.tagPagePrefix),
      encodeURIComponent(slugify(this.tag)),
    ].join('/');

    return `/${path}`;
  });

  protected readonly defaultVars = {
    site: this.site,
    tag: this.tag,
  } as const;

  protected readonly defaultFields = [] as const;
  constructor(private readonly tag: string, site: Required<Site>, themeFields?: Field[]) {
    super(site, themeFields);
  }
}

export class CustomPage extends Page {
  protected readonly defaultFields = [] as const;
  protected readonly defaultVars = {} as const;
  readonly pageId = this.pageName;
  readonly route = readonly(ref(`/${encodeURIComponent(this.pageName)}`));
  constructor(readonly pageName: string, site: Required<Site>, themeFields?: Field[]) {
    super(site, themeFields);
  }
}
