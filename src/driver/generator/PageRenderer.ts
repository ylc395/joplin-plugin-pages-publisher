import _, { pick, isString, mapValues, defaultsDeep, filter, sortBy } from 'lodash';
import ejs from 'ejs';
import moment from 'moment';
import { container } from 'tsyringe';
import { Feed } from 'feed';
import Ajv from 'ajv';
import { Site, DEFAULT_SITE } from 'domain/model/Site';
import type { GeneratingProgress } from 'domain/model/Publishing';
import type { Article } from 'domain/model/Article';
import type { Theme } from 'domain/model/Theme';
import { ARTICLE_PAGE_NAME, INDEX_PAGE_NAME, Page, PREDEFINED_FIELDS } from 'domain/model/Page';
import {
  outputFile,
  readFileSync,
  copy,
  move,
  remove,
  getAllFiles,
  pathExists,
} from 'driver/fs/joplinPlugin';
import { MarkdownRenderer } from './MarkdownRenderer';
import { loadTheme } from 'driver/themeLoader/joplinPlugin';
import { Db } from 'driver/db/joplinPlugin';
import { ARTICLE_SCHEMA } from 'driver/db/schema';
import { getValidator } from 'driver/utils';

import { addScriptLinkStyleTags } from './htmlProcess';
import type { RenderEnv } from './type';
import {
  getOutputDir,
  getOutputThemeAssetsDir,
  getThemeAssetsDir,
  getThemeDir,
} from './pathHelper';

ejs.fileLoader = readFileSync;

const db = container.resolve(Db);
const articleValidator = new Ajv().compile<Article>(ARTICLE_SCHEMA);
const validateArticle = getValidator(articleValidator, 'Invalid article');

type Data = Readonly<Record<string, unknown>>;

export class PageRenderer {
  private site?: Required<Site>;
  private markdownRenderer?: MarkdownRenderer;
  private pagesValues?: Record<string, Record<string, unknown> | undefined>;
  private themeDir?: string;
  private outputDir?: string;
  private pages?: Theme['pages'];
  readonly progress: GeneratingProgress = {
    totalPages: 0,
    generatedPages: 0,
  };

  async init() {
    this.progress.totalPages = 0;
    this.progress.generatedPages = 0;

    await this.getSite();
    await this.getThemeData();

    if (!this.site) {
      throw new Error('pageRenderer is not initialized');
    }

    this.markdownRenderer = new MarkdownRenderer(this.site.articles);
    await this.markdownRenderer.init();
    this.themeDir = await getThemeDir(this.site.themeName);
    this.outputDir = await getOutputDir();
  }

  private async getSite() {
    const site = await db.fetch<Site>(['site']);
    const articles = (await db.fetch<Article[]>(['articles'])) || [];
    articles.forEach(validateArticle);

    if (!site) {
      throw new Error('no site info in db.json');
    }

    site.articles = sortBy(filter(articles, { published: true }), ['createdAt']).reverse();
    site.generatedAt = Date.now();
    this.site = defaultsDeep(site, DEFAULT_SITE) as Required<Site>;
  }

  private async getThemeData() {
    if (!this.site) {
      throw new Error('pageRenderer is not initialized');
    }

    const { themeName } = this.site;
    const themeConfig = await loadTheme(themeName);

    if (!themeConfig) {
      throw new Error(`fail to load theme config: ${themeName}`);
    }

    const pagesValues = (await db.fetch<Data>(['pagesValues', themeName])) || {};
    const defaultPagesValues = mapValues(themeConfig.pages, (fields, pageName) => {
      const allFields = [...(fields || []), ...(PREDEFINED_FIELDS[pageName] || [])];
      return allFields.reduce((values, field) => {
        values[field.name] = field.defaultValue ?? null;

        return values;
      }, {} as Record<string, unknown>);
    });

    this.pagesValues = defaultsDeep(pagesValues, defaultPagesValues);
    this.pages = themeConfig.pages;
    defaultsDeep(this.site, {
      custom: {
        [themeName]: themeConfig.siteFields?.reduce((result, { name, defaultValue }) => {
          result[name] = defaultValue ?? null;
          return result;
        }, {} as NonNullable<Site['custom'][string]>),
      },
    });
  }

  private async outputPage(pageName: string) {
    if (
      !this.site ||
      !this.markdownRenderer ||
      !this.pagesValues ||
      !this.themeDir ||
      !this.pages ||
      !this.outputDir
    ) {
      throw new Error('no site when rendering');
    }

    const values = this.pagesValues[pageName];

    if (!values) {
      throw new Error(`no field values in ${pageName}`);
    }

    const { themeName } = this.site;
    const templatePath = `${this.themeDir}/templates/${pageName}.ejs`;
    const siteData = {
      ...pick(this.site, ['generatedAt', 'articles']),
      ...this.site.custom[themeName],
    };
    const env: RenderEnv = { $page: values, $site: siteData, _, _moment: moment };
    const markdownFieldNames = Page.getMarkdownFieldNames(this.pages[pageName] || []);

    for (const key of Object.keys(env.$page)) {
      const value = env.$page[key];

      if (markdownFieldNames.includes(key) && isString(value)) {
        env.$page[key] = (await this.markdownRenderer.render(Page.trimMarkdownPrefix(value))).html;
      }
    }

    env.$page.url = pageName === INDEX_PAGE_NAME ? 'index' : values.url || pageName;

    if (pageName === ARTICLE_PAGE_NAME) {
      await this.outputArticles(env);
    } else {
      const htmlString = await ejs.renderFile(templatePath, env);
      await outputFile(`${this.outputDir}/${env.$page.url}.html`, htmlString);
      this.progress.generatedPages += 1;
    }
  }

  private async outputArticles(env: RenderEnv) {
    if (!this.site || !this.markdownRenderer) {
      throw new Error('no site when rendering');
    }
    if (!isString(env.$page.dateFormat)) {
      throw new Error('no dateFormat');
    }

    if (!isString(env.$page.url)) {
      throw new Error('No url when generate article page.');
    }

    const templatePath = `${this.themeDir}/templates/${ARTICLE_PAGE_NAME}.ejs`;
    const recentArticles: Article[] = [];

    for (const article of this.site.articles) {
      const { html, resourceIds, pluginAssets, cssStrings } = await this.markdownRenderer.render(
        article.content,
        env.$page.url,
      );

      article.htmlContent = html;
      article.formattedCreatedAt = moment(article.createdAt).format(env.$page.dateFormat);
      article.formattedUpdatedAt = moment(article.updatedAt).format(env.$page.dateFormat);
      article.fullUrl = `/${env.$page.url}/${article.url}`;

      const htmlString = await ejs.renderFile(templatePath, { ...env, $article: article });

      await outputFile(
        `${this.outputDir}/${env.$page.url || ARTICLE_PAGE_NAME}/${article.url}.html`,
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

  private async outputFeed(articles: Article[]) {
    if (!this.outputDir) {
      throw new Error('no site when rendering');
    }

    const feed = new Feed({
      title: '',
      id: '',
      copyright: '',
      updated: moment(this.site?.generatedAt).toDate(),
      generator: 'Joplin Page Publisher',
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

    await outputFile(`${this.outputDir}/rss.xml`, feed.rss2());
    await outputFile(`${this.outputDir}/atom.xml`, feed.atom1());
    await outputFile(`${this.outputDir}/feed.json`, feed.json1());
  }

  async outputPages() {
    if (!this.pages || !this.site || !this.outputDir) {
      throw new Error('pageRenderer is not initialized');
    }

    const pageNames = Object.keys(this.pages);
    this.progress.totalPages = pageNames.length + this.site.articles.length - 1;

    const backupDir = `${this.outputDir}_backup`;
    try {
      if (await pathExists(this.outputDir)) {
        await move(this.outputDir, backupDir, { overwrite: true });
      }

      for (const pageName of pageNames) {
        await this.outputPage(pageName);
      }

      await this.copyAssets();
      await remove(backupDir);
      return await getAllFiles(this.outputDir);
    } catch (error) {
      if (await pathExists(backupDir)) {
        await move(backupDir, this.outputDir);
      }
      throw error;
    }
  }

  private async copyAssets() {
    if (!this.site || !this.themeDir || !this.outputDir) {
      throw new Error('pageRenderer is not initialized');
    }

    await copy(getThemeAssetsDir(this.themeDir), getOutputThemeAssetsDir(this.outputDir));
  }
}
