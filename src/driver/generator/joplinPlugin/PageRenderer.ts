import _, { isString, mapValues, defaultsDeep, mergeWith, filter, sortBy, keyBy } from 'lodash';
import ejs from 'ejs';
import moment from 'moment';
import { container } from 'tsyringe';
import { Feed } from 'feed';
import Ajv from 'ajv';
import { Site, DEFAULT_SITE } from 'domain/model/Site';
import type { GeneratingProgress, Github } from 'domain/model/Publishing';
import type { Article } from 'domain/model/Article';
import type { Theme } from 'domain/model/Theme';
import {
  ARTICLE_PAGE_NAME,
  INDEX_PAGE_NAME,
  Menu,
  Page,
  PREDEFINED_FIELDS,
} from 'domain/model/Page';
import fs, { getAllFiles } from 'driver/fs/joplinPlugin';
import { MarkdownRenderer } from './MarkdownRenderer';
import { loadTheme } from 'driver/themeLoader/joplinPlugin';
import { Db } from 'driver/db/joplinPlugin';
import { ARTICLE_SCHEMA } from 'driver/db/joplinPlugin/schema';
import { getValidator } from 'driver/utils';

import { addScriptLinkStyleTags } from './htmlProcess';
import type { PageEnv, ArticleForPage } from '../type';
import {
  getOutputDir,
  getOutputThemeAssetsDir,
  getThemeAssetsDir,
  getThemeDir,
  getIcon,
  getOutputIcon,
} from './pathHelper';

ejs.fileLoader = fs.readFileSync;

const db = container.resolve(Db);
const articleValidator = new Ajv().compile<Article>(ARTICLE_SCHEMA);
const validateArticle = getValidator(articleValidator, 'Invalid article');

export class PageRenderer {
  private site?: Required<Site>;
  private markdownRenderer?: MarkdownRenderer;
  private pagesValues?: Record<string, PageEnv['$page'] | undefined>;
  private themeDir?: string;
  private outputDir?: string;
  private cname?: string;
  private pages?: Theme['pages'];
  private articles?: ArticleForPage[];
  readonly progress: GeneratingProgress = {
    totalPages: 0,
    generatedPages: 0,
  };

  async init() {
    this.progress.totalPages = 0;
    this.progress.generatedPages = 0;

    await this.getSite();
    await this.getThemeData();
    await this.getArticles();

    if (!this.site || !this.articles) {
      throw new Error('pageRenderer is not initialized');
    }

    this.markdownRenderer = new MarkdownRenderer(this.articles);
    await this.markdownRenderer.init();
    this.themeDir = await getThemeDir(this.site.themeName);
    this.outputDir = await getOutputDir();
  }

  private async getSite() {
    const site = await db.fetch<Site>(['site']);
    const githubInfo = await db.fetch<Github>(['github']);

    this.cname = githubInfo?.cname;
    this.site = defaultsDeep({ ...site, generatedAt: Date.now() }, DEFAULT_SITE) as Required<Site>;
  }

  private async getArticles() {
    if (!this.pagesValues || !this.pages) {
      throw new Error('no pagesValues');
    }

    if (!this.pages[ARTICLE_PAGE_NAME]) {
      return [];
    }

    const articlePageUrl = this.getPageUrl(ARTICLE_PAGE_NAME);
    const articles = (await db.fetch<Article[]>(['articles'])) || [];

    articles.forEach(validateArticle);
    this.articles = sortBy(filter(articles, { published: true }), ['createdAt'])
      .reverse()
      .map((article) => ({
        ...article,
        fullUrl: `${articlePageUrl}/${article.url}`,
        htmlContent: '',
      }));
  }

  private async getThemeData() {
    if (!this.site) {
      throw new Error('pageRenderer is not initialized');
    }

    const { themeName } = this.site;
    const themeConfig = await loadTheme(themeName);

    this.pages = themeConfig.pages;

    if (!themeConfig) {
      throw new Error(`fail to load theme config: ${themeName}`);
    }

    const pagesValues = (await db.fetch<Record<string, unknown>>(['pagesValues', themeName])) || {};
    const defaultPagesValues = mapValues(themeConfig.pages, (fields, pageName) => {
      const allFields = [...(fields || []), ...(PREDEFINED_FIELDS[pageName] || [])];
      return allFields.reduce((values, field) => {
        values[field.name] = field.defaultValue ?? null;

        return values;
      }, {} as Record<string, unknown>);
    });

    // todo: we need to restrict usage of "null" in this whole app
    const customMerge = (value: unknown, srcValue: unknown) => {
      if (srcValue === null || srcValue === '') {
        return value;
      }
    };

    this.pagesValues = mergeWith({}, defaultPagesValues, pagesValues, customMerge);
    mergeWith(
      this.site.custom,
      {
        [themeName]: themeConfig.siteFields?.reduce((result, { name, defaultValue }) => {
          result[name] = defaultValue ?? null;
          return result;
        }, {} as NonNullable<Site['custom'][string]>),
      },
      customMerge,
    );
  }

  private async outputPage(pageName: string) {
    if (!this.themeDir || !this.outputDir) {
      throw new Error('no site when rendering');
    }

    const templatePath = `${this.themeDir}/templates/${pageName}.ejs`;
    const env = await this.getPageEnv(pageName);

    if (pageName === ARTICLE_PAGE_NAME) {
      await this.outputArticles(env);
    } else {
      const htmlString = await ejs.renderFile(templatePath, env);
      await fs.outputFile(`${this.outputDir}/${this.getPageUrl(pageName)}.html`, htmlString);
      this.progress.generatedPages += 1;
    }
  }

  private getPageUrl(pageName: string) {
    const values = this.pagesValues?.[pageName];

    if (!values) {
      throw new Error('no pagesValues');
    }

    if (pageName === INDEX_PAGE_NAME) {
      return 'index';
    }

    if (isString(values.url)) {
      return values.url || pageName;
    }

    return pageName;
  }

  private async getPageEnv(pageName: string) {
    const { pages, pagesValues } = this;

    if (!this.site || !this.markdownRenderer || !pages || !pagesValues || !this.articles) {
      throw new Error('no site when rendering');
    }
    const values = pagesValues[pageName];

    if (!values) {
      throw new Error(`no field values in ${pageName}`);
    }

    const { themeName } = this.site;
    const env: PageEnv = {
      $page: { ...values },
      $site: {
        ...this.site.custom[themeName],
        generatedAt: this.site.generatedAt,
        articles: this.articles,
      },
      $link: {
        rss: this.site.feedEnabled ? '/rss.xml' : '',
        ...mapValues(this.pages, (_, pageName) => `/${this.getPageUrl(pageName)}`),
      },
      _,
      moment,
    };

    const fields = pages[pageName] || [];

    // process markdown / menu type field
    const markdownFieldNames = Page.getFieldNamesOfType(fields, 'markdown');
    const menuFieldNames = Page.getFieldNamesOfType(fields, 'menu');

    for (const key of Object.keys(env.$page)) {
      const value = env.$page[key];

      if (markdownFieldNames.includes(key) && isString(value)) {
        env.$page[key] = (await this.markdownRenderer.render(value)).html;
      }

      if (menuFieldNames.includes(key)) {
        env.$page[key] = Array.isArray(value)
          ? (value as Menu).map(({ label, link }) => ({
              label,
              link: this.getUrlFromLink(link),
            }))
          : [];
      }
    }
    return env;
  }

  private getUrlFromLink(link: string) {
    const { pages, articles } = this;

    if (!pages || !articles) {
      throw new Error('no pages or articles data');
    }

    const articleMap = keyBy(articles, 'noteId');
    if (link in articleMap) {
      return `/${articleMap[link].fullUrl}`;
    }

    if (link in pages) {
      return `/${this.getPageUrl(link)}`;
    }

    return link;
  }

  private async outputArticles(env: PageEnv) {
    if (!this.site || !this.markdownRenderer || !this.articles) {
      throw new Error('no site when rendering');
    }

    const templatePath = `${this.themeDir}/templates/${ARTICLE_PAGE_NAME}.ejs`;
    const recentArticles: ArticleForPage[] = [];

    for (const article of this.articles) {
      const { html, resourceIds, pluginAssets, cssStrings } = await this.markdownRenderer.render(
        article.content,
        this.getPageUrl(ARTICLE_PAGE_NAME),
      );

      article.htmlContent = html;

      const _env: PageEnv = { ...env, $article: article };
      const htmlString = await ejs.renderFile(templatePath, _env);

      await fs.outputFile(
        `${this.outputDir}/${article.fullUrl}.html`,
        addScriptLinkStyleTags(htmlString, pluginAssets, cssStrings),
      );
      await this.markdownRenderer.outputResources(resourceIds);
      await this.markdownRenderer.copyMarkdownPluginAssets(pluginAssets);
      this.progress.generatedPages += 1;

      if (recentArticles.length < this.site.feedLength) {
        recentArticles.push(article);
      }
    }

    if (this.site.feedEnabled) {
      await this.outputFeed(recentArticles);
    }
  }

  private async outputFeed(articles: ArticleForPage[]) {
    if (!this.outputDir) {
      throw new Error('no site when rendering');
    }

    const feed = new Feed({
      title: '',
      id: '',
      copyright: '',
      updated: moment(this.site?.generatedAt).toDate(),
      generator: 'Joplin Pages Publisher',
    });

    for (const article of articles) {
      feed.addItem({
        title: article.title,
        id: article.noteId,
        link: '',
        date: moment(article.createdAt).toDate(),
        content: article.htmlContent,
      });
    }

    await fs.outputFile(`${this.outputDir}/rss.xml`, feed.rss2());
  }

  async outputPages() {
    if (!this.pages || !this.site || !this.outputDir || !this.articles) {
      throw new Error('pageRenderer is not initialized');
    }

    const pageNames = Object.keys(this.pages);
    this.progress.totalPages = pageNames.length + this.articles.length - 1;

    await fs.remove(this.outputDir);

    for (const pageName of pageNames) {
      await this.outputPage(pageName);
    }

    await this.copyAssets();
    await this.outputCname();
    await this.copyIcon();
    return await getAllFiles(this.outputDir);
  }

  private async outputCname() {
    if (!this.outputDir) {
      throw new Error('pageRenderer is not initialized');
    }

    if (this.cname) {
      await fs.outputFile(`${this.outputDir}/CNAME`, this.cname);
    }
  }

  private async copyAssets() {
    if (!this.site || !this.themeDir || !this.outputDir) {
      throw new Error('pageRenderer is not initialized');
    }

    await fs.copy(getThemeAssetsDir(this.themeDir), getOutputThemeAssetsDir(this.outputDir));
  }

  private async copyIcon() {
    if (!this.outputDir) {
      throw new Error('no output dir');
    }

    const icon = await getIcon();
    const outputIcon = getOutputIcon(this.outputDir);
    await fs.remove(outputIcon);

    try {
      await fs.copy(icon, outputIcon);
    } catch {
      return;
    }
  }
}
