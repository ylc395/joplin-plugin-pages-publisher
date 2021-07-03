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
  protected abstract readonly defaultFields: Readonly<Field[]>;
  protected abstract readonly defaultVars: Readonly<Vars>; // vars provide by this plugin. can not be updated by user
  protected readonly fieldVars: Vars; // vars provided by fields, which are defined by theme and this plugin. Comes from persistence layer, can be updated by user via fields
  constructor(protected readonly site: Site, fieldVars: Vars) {
    this.fieldVars = reactive(fieldVars);
  }

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
  protected readonly defaultVars: Vars = {
    site: this.site,
  };
}

export class ArticlePage extends Page {
  static readonly pageName = ARTICLE_PAGE_NAME;
  readonly pageId = this.article ? ArticlePage.getPageId(this.article) : ArticlePage.pageName;
  readonly defaultFields = this.article
    ? ([
        { name: 'url', required: true, defaultValue: slugify(this.article.title) },
        { name: 'createdAt', required: true, defaultValue: this.article.createdAt },
        { name: 'updatedAt', required: true, defaultValue: this.article.updatedAt },
        {
          name: 'tags',
          defaultValue: this.article.tags,
          inputType: 'multiple-select',
        },
      ] as const)
    : [];
  readonly defaultVars: Vars = {
    site: this.site,
    article: this.article,
  };
  readonly route = computed(() => {
    const path = [
      encodeURIComponent(this.site.articlePagePrefix),
      encodeURIComponent(this.fieldVars.value.url),
    ].join('/');

    return `/${path}`;
  });

  constructor(site: Site, fieldVars: Vars, readonly article?: Article) {
    super(site, fieldVars);
  }

  static getPageId(article: Article) {
    return `${ArticlePage.pageName}_${article.noteId.slice(0, 5)}`;
  }
}

export class ArchivesPage extends Page {
  static readonly pageName = ARCHIVES_PAGE_NAME;
  readonly pageId = this.pageNum
    ? `${ArchivesPage.pageName}_${this.pageNum}`
    : ArchivesPage.pageName;
  readonly route = computed(() => {
    const path = [
      encodeURIComponent(this.site.archivesPagePrefix),
      this.pageNum ? encodeURIComponent(this.pageNum) : ':page',
    ].join('/');

    return `/${path}`;
  });
  protected readonly defaultFields = [
    { name: 'articlesCount', label: 'Articles Per Page', defaultValue: 10, inputType: 'number' },
  ] as const;

  protected get defaultVars() {
    if (!this.pageNum) {
      return {};
    }

    const articlesChunks = chunk(this.site.articles, this.fieldVars.value.articleCount);

    return {
      site: this.site,
      pagination: {
        current: this.pageNum,
        next: articlesChunks[this.pageNum + 1] ? this.pageNum + 1 : null,
        prev: this.pageNum === 1 ? null : this.pageNum - 1,
      },
    } as const;
  }

  constructor(site: Site, fieldVars: Vars, readonly pageNum?: number) {
    super(site, fieldVars);
  }
}

export class TagPage extends Page {
  static readonly pageName = TAG_PAGE_NAME;
  readonly pageId = `${TagPage.pageName}_${this.tag}`;
  readonly route = computed(() => {
    const path = [
      encodeURIComponent(this.site.tagPagePrefix),
      this.tag ? encodeURIComponent(slugify(this.tag)) : ':tag',
    ].join('/');

    return `/${path}`;
  });

  protected readonly defaultVars = {
    site: this.site,
    tag: this.tag,
  } as const;

  protected readonly defaultFields = [] as const;
  constructor(site: Site, fieldVars: Vars, private readonly tag?: string) {
    super(site, fieldVars);
  }
}

export class CustomPage extends Page {
  protected readonly defaultFields = [] as const;
  protected readonly defaultVars = {} as const;
  readonly pageId = this.pageName;
  readonly route = readonly(ref(`/${encodeURIComponent(this.pageName)}`));
  constructor(private readonly pageName: string, site: Site, fieldVars: Vars) {
    super(site, fieldVars);
  }
}
