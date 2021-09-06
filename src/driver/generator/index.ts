import ejs from 'ejs';
import moment from 'moment';
import _, { isString, pick } from 'lodash';
import joplin from 'api';
import type { readFileSync as IReadFileSync, outputFile as IOutputFile } from 'fs-extra';
import type { Site } from '../../domain/model/Site';
import { ARTICLE_PAGE_NAME, INDEX_PAGE_NAME } from '../../domain/model/Page';
import { renderMarkdown } from './markdown';
import {
  getThemeDir,
  getSite,
  getThemeData,
  copyAssets,
  outputResources,
  getJoplinMarkdownSetting,
  getOutputDir,
  getAllResources,
  copyMarkdownPluginAssets,
} from './utils';
import type { ResourceMap } from './type';

const { readFileSync, outputFile } = joplin.require('fs-extra') as {
  readFileSync: typeof IReadFileSync;
  outputFile: typeof IOutputFile;
};

ejs.fileLoader = readFileSync;

async function outputPage(
  pageName: string,
  values: Record<string, unknown>,
  site: Required<Site>,
  mdPlugins: Record<string, unknown>,
  themeDir: string,
  allResource: ResourceMap,
) {
  const { themeName } = site;
  const templatePath = `${themeDir}/templates/${pageName}.ejs`;
  const siteData = { ...pick(site, ['generateAt', 'articles']), ...site.custom[themeName] };
  const outputDir = await getOutputDir();

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

    for (const article of site.articles) {
      article.formattedCreatedAt = moment(article.createdAt).format(values.dateFormat);
      article.formattedUpdatedAt = moment(article.updatedAt).format(values.dateFormat);
      article.fullUrl = `/${values.url}/${article.url}`;
      const { html, resourceIds, pluginAssets } = await renderMarkdown(
        article.content,
        String(values.url),
        mdPlugins,
        allResource,
        site.articles,
      );

      /* 
        todo: process html
       1. remove joplin-* class name
       2. remove joplin icon
       3. add markdown plugin assets(script/css)
       */
      article.htmlContent = html;

      const htmlString = await ejs.renderFile(templatePath, { ...env, $article: article });
      await outputFile(`${outputDir}/${values.url || pageName}/${article.url}.html`, htmlString);
      await outputResources(resourceIds, allResource);
      await copyMarkdownPluginAssets(pluginAssets);
    }
  } else {
    const htmlString = await ejs.renderFile(templatePath, env);
    await outputFile(
      `${outputDir}/${pageName === INDEX_PAGE_NAME ? 'index' : values.url || pageName}.html`,
      htmlString,
    );
  }
}

export default async function () {
  try {
    const site = await getSite();
    const { pages, fieldValues } = await getThemeData(site.themeName);
    const mdPlugins = await getJoplinMarkdownSetting();
    const themeDir = await getThemeDir(site.themeName);
    const allResource = await getAllResources();

    for (const pageName of Object.keys(pages)) {
      await outputPage(pageName, fieldValues[pageName], site, mdPlugins, themeDir, allResource);
    }
    await copyAssets(site.themeName);
  } catch (error) {
    console.warn(error);
    throw error;
  }
}
