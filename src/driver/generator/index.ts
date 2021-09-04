import ejs from 'ejs';
import moment from 'moment';
import _, { isString, pick } from 'lodash';
import joplin from 'api';
import type { readFileSync as IReadFileSync, outputFile as IOutputFile } from 'fs-extra';
import type { Site } from '../../domain/model/Site';
import { ARTICLE_PAGE_NAME, INDEX_PAGE_NAME } from '../../domain/model/Page';
import { renderMarkdown } from './markdown';
import { getThemeDir, getSite, getThemeData, copyAssets, getJoplinMarkdownSetting } from './utils';

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
  { dataDir, themeDir }: { dataDir: string; themeDir: string },
) {
  const { themeName } = site;
  const templatePath = `${themeDir}/templates/${pageName}.ejs`;
  const siteData = { ...pick(site, ['generateAt', 'articles']), ...site.custom[themeName] };

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
      article.htmlContent = (await renderMarkdown(article.content, mdPlugins)).html;

      const htmlString = await ejs.renderFile(templatePath, { ...env, $article: article });
      await outputFile(
        `${dataDir}/output/${values.url || pageName}/${article.url}.html`,
        htmlString,
      );
    }
  } else {
    const htmlString = await ejs.renderFile(templatePath, env);
    await outputFile(
      `${dataDir}/output/${pageName === INDEX_PAGE_NAME ? 'index' : values.url || pageName}.html`,
      htmlString,
    );
  }
}

export default async function () {
  try {
    const site = await getSite();
    const { pages, fieldValues } = await getThemeData(site.themeName);
    const mdPlugins = await getJoplinMarkdownSetting();
    const dataDir = await joplin.plugins.dataDir();
    const themeDir = await getThemeDir(site.themeName);

    for (const pageName of Object.keys(pages)) {
      await outputPage(pageName, fieldValues[pageName], site, mdPlugins, { dataDir, themeDir });
    }
    await copyAssets(site.themeName);
  } catch (error) {
    console.warn(error);
    throw error;
  }
}
