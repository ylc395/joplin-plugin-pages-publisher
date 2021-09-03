import { container } from 'tsyringe';
import ejs from 'ejs';
import moment from 'moment';
import _, { filter, isString, mapValues, merge, pick } from 'lodash';
import joplin from 'api';
import type {
  readFileSync as IReadFileSync,
  outputFile as IOutputFile,
  copy as ICopy,
} from 'fs-extra';
import type { Site } from '../../domain/model/Site';
import type { Article } from '../../domain/model/Article';
import { ARTICLE_PAGE_NAME, INDEX_PAGE_NAME, PREDEFINED_FIELDS } from '../../domain/model/Page';
import { Db } from '../db';
import { loadTheme } from '../themeLoader';
import { DEFAULT_THEME_NAME } from '../../domain/model/Theme';

const { readFileSync, outputFile, copy } = joplin.require('fs-extra') as {
  readFileSync: typeof IReadFileSync;
  outputFile: typeof IOutputFile;
  copy: typeof ICopy;
};
const db = container.resolve(Db);

ejs.fileLoader = readFileSync;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = Readonly<Record<string, any>>;

async function getSite() {
  const site = await db.fetch<Site>(['site']);
  const articles = filter((await db.fetch<Article[]>(['articles'])) || [], { published: true });

  if (!site) {
    throw new Error('no site info in db.json');
  }

  site.articles = articles;
  site.generatedAt = Date.now();

  return site as Required<Site>;
}

async function getThemeData(themeName: string) {
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

  return { fieldValues: merge(defaultFieldVars, pagesFieldVars), pages: themeConfig.pages };
}

async function getThemeDir(themeName: string) {
  const themeDir =
    themeName === DEFAULT_THEME_NAME
      ? `${await joplin.plugins.installationDir()}/assets/defaultTheme`
      : `${await joplin.plugins.dataDir}/themes/${themeName}`;

  return themeDir;
}

async function outputPage(pageName: string, values: Record<string, unknown>, site: Required<Site>) {
  const { themeName } = site;
  const dataDir = await joplin.plugins.dataDir();
  const themeDir = await getThemeDir(themeName);
  const templatePath = `${themeDir}/templates/${pageName}.ejs`;
  const siteData = { ...pick(site, ['generateAt', 'articles']), ...site.custom[themeName] };

  if (pageName === ARTICLE_PAGE_NAME) {
    for (const article of site.articles) {
      if (!isString(values.dateFormat)) {
        throw new Error('no dateFormat');
      }

      article.formattedCreatedAt = moment(article.createdAt).format(values.dateFormat);
      article.formattedUpdatedAt = moment(article.updatedAt).format(values.dateFormat);
      article.fullUrl = `/${values.url}/${article.url}`;

      const htmlString = await ejs.renderFile(templatePath, {
        $page: values,
        $article: article,
        $site: siteData,
        _,
      });
      await outputFile(
        `${dataDir}/output/${values.url || pageName}/${article.url}.html`,
        htmlString,
      );
    }
  } else {
    const htmlString = await ejs.renderFile(templatePath, { $page: values, $site: siteData, _ });
    await outputFile(
      `${dataDir}/output/${pageName === INDEX_PAGE_NAME ? 'index' : values.url || pageName}.html`,
      htmlString,
    );
  }
}

async function copyAssets(themeName: string) {
  const themeDir = await getThemeDir(themeName);
  const dataDir = await joplin.plugins.dataDir();
  const assetsPath = `${themeDir}/_assets`;

  await copy(assetsPath, `${dataDir}/output/_assets`);
}

export default async function () {
  try {
    const site = await getSite();
    const { pages, fieldValues } = await getThemeData(site.themeName);

    for (const pageName of Object.keys(pages)) {
      await outputPage(pageName, fieldValues[pageName], site);
    }
    await copyAssets(site.themeName);
  } catch (error) {
    console.warn(error);
    throw error;
  }
}
