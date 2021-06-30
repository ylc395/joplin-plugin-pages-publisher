import { chunk } from 'lodash';
import slugify from 'slugify';
import { container } from 'tsyringe';
import { computed, reactive, Ref, ref, shallowReactive } from 'vue';
import type { Article } from './Article';
import { token as siteToken } from './Site';

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
type Env = Record<string, any>;

export abstract class Page {
  readonly site = container.resolve(siteToken);
  abstract readonly pageId: string;
  abstract readonly route: Ref<string>; // url of this page
  protected abstract readonly defaultVars: Readonly<Env>; // vars provide by this plugin
  protected abstract readonly defaultFields: Readonly<Field[]>; // fields defined by this plugin
  constructor(
    private readonly themeFields: Readonly<Field[]>, // fields defined by theme
    protected readonly fieldVars: Env, // vars provided by fields, which are defined by theme and this plugin. Comes from persistence layer, can be updated by user via fields
  ) {
    this.fieldVars = reactive(fieldVars); // fieldVars is reactive because it will be displayed in UI
  }

  get fields() {
    return [...this.defaultFields, ...this.themeFields];
  }
  get vars(): Env {
    return { ...this.defaultVars, ...this.fieldVars };
  }
}

export class HomePage extends Page {
  static readonly templateName = INDEX_PAGE_NAME;
  readonly pageId = HomePage.templateName;
  readonly route = ref('/');
  protected readonly defaultFields = [] as const;
  protected readonly defaultVars: Env = shallowReactive({
    site: this.site,
  });
}

export class ArticlePage extends Page {
  static readonly templateName = ARTICLE_PAGE_NAME;
  readonly pageId = `${ArticlePage.templateName}_${this.article.noteId.slice(0, 5)}`;
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
  readonly defaultVars: Env = {
    site: this.site,
    article: this.article,
  };
  readonly route = computed(() => {
    const path = [
      encodeURIComponent(this.site.articlePagePrefix.value),
      encodeURIComponent(this.fieldVars.url),
    ].join('/');

    return `/${path}`;
  });

  constructor(readonly article: Article, themeFields: Field[], fieldVars: Env) {
    super(themeFields, fieldVars);
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

  constructor(readonly pageNum: number, themeFields: Field[], fieldVars: Env) {
    super(themeFields, fieldVars);
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

  protected readonly defaultVars = {
    site: this.site,
    tag: this.tag,
  } as const;

  protected readonly defaultFields = [] as const;
  constructor(private readonly tag: string, themeFields: Field[], fieldVars: Env) {
    super(themeFields, fieldVars);
  }
}

export class CustomPage extends Page {
  protected readonly defaultFields = [] as const;
  protected readonly defaultVars = {} as const;
  readonly pageId = this.templateName;
  readonly route = ref(`/${encodeURIComponent(this.templateName)}`);
  constructor(readonly templateName: string, themeFields: Field[], fieldVars: Env) {
    super(themeFields, fieldVars);
  }
}
