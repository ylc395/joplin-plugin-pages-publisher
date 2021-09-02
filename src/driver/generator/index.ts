import { container } from 'tsyringe';
import ejs from 'ejs';
import _, { filter, mapValues, pick } from 'lodash';
import joplin from 'api';
import type { readFileSync as IReadFileSync, outputFile as IOutputFile } from 'fs-extra';
import type { Site } from '../../domain/model/Site';
import type { Article } from '../../domain/model/Article';
import { ARTICLE_PAGE_NAME, INDEX_PAGE_NAME } from '../../domain/model/Page';
import { Db } from '../db';
import { loadTheme } from '../themeLoader';
import { DEFAULT_THEME_NAME } from '../../domain/model/Theme';

const { readFileSync, outputFile } = joplin.require('fs-extra') as {
  readFileSync: typeof IReadFileSync;
  outputFile: typeof IOutputFile;
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
  const defaultFieldVars = mapValues(themeConfig.pages, (fields) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return fields!.reduce((vars, field) => {
      vars[field.name] = field.defaultValue || '';
      return vars;
    }, {} as Record<string, unknown>);
  });

  return { pagesFieldVars, pages: themeConfig.pages, defaultFieldVars };
}

async function outputPage(pageName: string, values: Record<string, unknown>, site: Required<Site>) {
  const { themeName } = site;
  const dataDir = await joplin.plugins.dataDir();
  const themeDir =
    themeName === DEFAULT_THEME_NAME
      ? `${await joplin.plugins.installationDir()}/assets/defaultTheme`
      : `${dataDir}/themes/${themeName}`;
  const templatePath = `${themeDir}/templates/${pageName}.ejs`;
  const siteData = { ...pick(site, ['generateAt', 'articles']), ...site.custom[themeName] };

  if (pageName === ARTICLE_PAGE_NAME) {
    for (const article of site.articles) {
      const htmlString = await ejs.renderFile(
        templatePath,
        { ...values, $article: article, $site: siteData, _ },
        { async: true },
      );
      await outputFile(
        `${dataDir}/output/${values.url || pageName}/${article.url}.html`,
        htmlString,
      );
    }
  } else {
    const htmlString = await ejs.renderFile(
      templatePath,
      { ...values, $site: siteData, _ },
      { async: true },
    );
    await outputFile(
      `${dataDir}/output/${pageName === INDEX_PAGE_NAME ? 'index' : values.url || pageName}.html`,
      htmlString,
    );
  }
}

export default async function () {
  try {
    const site = await getSite();
    const { pages, pagesFieldVars, defaultFieldVars } = await getThemeData(site.themeName);

    for (const pageName of Object.keys(pages)) {
      const fieldValues = { ...defaultFieldVars[pageName], ...pagesFieldVars[pageName] };
      await outputPage(pageName, fieldValues, site);
    }
  } catch (error) {
    console.warn(error);
    throw error;
  }
}
