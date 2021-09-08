import _, { pick, isString, mapValues, merge, filter, sortBy } from 'lodash';
import ejs from 'ejs';
import moment from 'moment';
import { container } from 'tsyringe';
import { Feed } from 'feed';
import { Site, DEFAULT_SITE } from '../../domain/model/Site';
import type { Article } from '../../domain/model/Article';
import type { Theme } from '../../domain/model/Theme';
import { ARTICLE_PAGE_NAME, INDEX_PAGE_NAME, PREDEFINED_FIELDS } from '../../domain/model/Page';
import {
  getOutputDir,
  getOutputThemeAssetsDir,
  getThemeAssetsDir,
  getThemeDir,
} from './pathHelper';
import { outputFile, readFileSync, copy, rename, remove } from '../fs/joplinPlugin';
import { MarkdownRenderer } from './MarkdownRenderer';
import { loadTheme } from '../themeLoader/joplinPlugin';
import { Db } from '../db/joplinPlugin';
import { addScriptLinkStyleTags } from './htmlProcess';
import type { RenderEnv } from './type';

ejs.fileLoader = readFileSync;

const db = container.resolve(Db);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = Readonly<Record<string, any>>;

export class PageRenderer {
  private site?: Required<Site>;
  private markdownRenderer?: MarkdownRenderer;
  private pageFieldValues?: Record<string, unknown>;
  private themeDir?: string;
  private outputDir?: string;
  private pages?: Theme['pages'];

  async init() {
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

    if (!site) {
      throw new Error('no site info in db.json');
    }

    site.articles = sortBy(filter(articles, { published: true }), ['createdAt']).reverse();
    site.generatedAt = Date.now();
    this.site = { ...DEFAULT_SITE, ...site } as Required<Site>;
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

    const pagesFieldVars = (await db.fetch<Data>(['pagesFieldVars', themeName])) || {};
    const defaultFieldVars = mapValues(themeConfig.pages, (fields, pageName) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const allFields = [...fields!, ...(PREDEFINED_FIELDS[pageName] || [])];
      return allFields.reduce((vars, field) => {
        vars[field.name] = field.defaultValue ?? '';

        return vars;
      }, {} as Record<string, unknown>);
    });

    this.pageFieldValues = merge(defaultFieldVars, pagesFieldVars);
    this.pages = themeConfig.pages;
  }

  private async outputPage(pageName: string) {
    if (
      !this.site ||
      !this.markdownRenderer ||
      !this.pageFieldValues ||
      !this.themeDir ||
      !this.outputDir
    ) {
      throw new Error('no site when rendering');
    }

    const values = this.pageFieldValues[pageName] as Record<string, unknown>;
    const { themeName } = this.site;
    const templatePath = `${this.themeDir}/templates/${pageName}.ejs`;
    const siteData = {
      ...pick(this.site, ['generatedAt', 'articles']),
      ...this.site.custom[themeName],
    };

    const env: RenderEnv = { $page: values, $site: siteData, _, _moment: moment };
    if (pageName === ARTICLE_PAGE_NAME) {
      await this.outputArticles(env);
    } else {
      const htmlString = await ejs.renderFile(templatePath, env);
      await outputFile(
        `${this.outputDir}/${pageName === INDEX_PAGE_NAME ? 'index' : values.url || pageName}.html`,
        htmlString,
      );
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

    const backupDir = `${this.outputDir}_backup`;
    try {
      await rename(this.outputDir, backupDir);
      for (const pageName of Object.keys(this.pages)) {
        await this.outputPage(pageName);
      }

      await this.copyAssets();
      await remove(backupDir);
    } catch (error) {
      await rename(backupDir, this.outputDir);
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
