import _, { pick, isString, mapValues, merge, filter } from 'lodash';
import ejs from 'ejs';
import moment from 'moment';
import { container } from 'tsyringe';
import type { Site } from '../../domain/model/Site';
import type { Article } from '../../domain/model/Article';
import type { Theme } from '../../domain/model/Theme';
import { ARTICLE_PAGE_NAME, INDEX_PAGE_NAME, PREDEFINED_FIELDS } from '../../domain/model/Page';
import { getOutputDir, getThemeDir } from './pathHelper';
import { outputFile, readFileSync, copy } from '../fs';
import { MarkdownRenderer } from './MarkdownRenderer';
import { loadTheme } from '../themeLoader';
import { Db } from '../db';
import { addScriptLinkStyleTags } from './htmlProcess';

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
    const articles = filter((await db.fetch<Article[]>(['articles'])) || [], { published: true });

    if (!site) {
      throw new Error('no site info in db.json');
    }

    site.articles = articles;
    site.generatedAt = Date.now();
    this.site = site as Required<Site>;
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
      ...pick(this.site, ['generateAt', 'articles']),
      ...this.site.custom[themeName],
    };

    const env = {
      $page: values,
      $site: siteData,
      _,
      _moment: moment,
    };

    if (pageName === ARTICLE_PAGE_NAME) {
      if (!isString(values.dateFormat)) {
        throw new Error('no dateFormat');
      }

      if (!isString(values.url)) {
        throw new Error('No url when generate article page.');
      }

      for (const article of this.site.articles) {
        const { html, resourceIds, pluginAssets, cssStrings } = await this.markdownRenderer.render(
          article.content,
          values.url,
        );

        article.htmlContent = html;
        article.formattedCreatedAt = moment(article.createdAt).format(values.dateFormat);
        article.formattedUpdatedAt = moment(article.updatedAt).format(values.dateFormat);
        article.fullUrl = `/${values.url}/${article.url}`;

        const htmlString = await ejs.renderFile(templatePath, { ...env, $article: article });

        await outputFile(
          `${this.outputDir}/${values.url || pageName}/${article.url}.html`,
          addScriptLinkStyleTags(htmlString, pluginAssets, cssStrings),
        );
        await this.markdownRenderer.outputResources(resourceIds);
        await this.markdownRenderer.copyMarkdownPluginAssets(pluginAssets);
      }
    } else {
      const htmlString = await ejs.renderFile(templatePath, env);
      await outputFile(
        `${this.outputDir}/${pageName === INDEX_PAGE_NAME ? 'index' : values.url || pageName}.html`,
        htmlString,
      );
    }
  }

  async outputPages() {
    if (!this.pages || !this.site) {
      throw new Error('pageRenderer is not initialized');
    }

    for (const pageName of Object.keys(this.pages)) {
      await this.outputPage(pageName);
    }

    await this.copyAssets();
  }

  private async copyAssets() {
    if (!this.site || !this.themeDir || !this.outputDir) {
      throw new Error('pageRenderer is not initialized');
    }

    const assetsPath = `${this.themeDir}/_assets`;
    await copy(assetsPath, `${this.outputDir}/_assets`);
  }
}
