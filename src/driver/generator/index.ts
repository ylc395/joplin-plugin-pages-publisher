import { container } from 'tsyringe';
import ejs from 'ejs';
import { ARTICLE_PAGE_NAME, INDEX_PAGE_NAME } from '../../domain/model/Page';
import { Db } from '../db';
import { loadTheme } from '../themeLoader';
import { filter } from 'lodash';
import joplin from 'api';
import type { readFileSync as IReadFileSync, outputFile as IOutputFile } from 'fs-extra';

const { readFileSync, outputFile } = joplin.require('fs-extra') as {
  readFileSync: typeof IReadFileSync;
  outputFile: typeof IOutputFile;
};

ejs.fileLoader = readFileSync;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = Readonly<Record<string, any>>;

export default async function () {
  const db = container.resolve(Db);
  const site = await db.fetch<Data>(['site']);

  if (!site) {
    throw new Error('no site info in db.json');
  }

  const themeConfig = await loadTheme(site.themeName);

  if (!themeConfig) {
    throw new Error(`fail to load theme config: ${site.themeName}`);
  }

  const articles = filter((await db.fetch<Data[]>(['articles'])) || [], { published: true });
  const pagesFieldVars = (await db.fetch<Data>(['pagesFieldVars', site.themeName])) || {};

  const pages = themeConfig.pages;
  const pluginDir = await joplin.plugins.dataDir();

  for (const pageName of Object.keys(pages)) {
    const fieldVars = pagesFieldVars[pageName] || {};
    const templatePath = `${pluginDir}/themes/${site.themeName}/templates/${pageName}.ejs`;

    if (pageName === ARTICLE_PAGE_NAME) {
      for (const article of articles) {
        const htmlString = await ejs.renderFile(
          templatePath,
          { ...fieldVars, article },
          { async: true },
        );
        await outputFile(`${pluginDir}/output/${fieldVars.url}/${article.url}.html`, htmlString);
      }
    } else {
      const htmlString = await ejs.renderFile(templatePath, fieldVars, { async: true });
      await outputFile(
        `${pluginDir}/output/${
          pageName === INDEX_PAGE_NAME ? 'index' : fieldVars.url || fieldVars.name
        }.html`,
        htmlString,
      );
    }
  }
}