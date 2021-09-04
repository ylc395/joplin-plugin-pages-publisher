import { DEFAULT_THEME_NAME } from '../../domain/model/Theme';
import joplin from 'api';
import { container } from 'tsyringe';
import type { copy as ICopy } from 'fs-extra';
import { Db } from '../db';
import { loadTheme } from '../themeLoader';
import type { Article } from '../../domain/model/Article';
import type { Site } from '../../domain/model/Site';
import { filter, mapValues, merge } from 'lodash';
import { PREDEFINED_FIELDS } from '../../domain/model/Page';

const db = container.resolve(Db);
const { copy } = joplin.require('fs-extra') as { copy: typeof ICopy };

export async function getThemeDir(themeName: string) {
  const themeDir =
    themeName === DEFAULT_THEME_NAME
      ? `${await joplin.plugins.installationDir()}/assets/defaultTheme`
      : `${await joplin.plugins.dataDir()}/themes/${themeName}`;

  return themeDir;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = Readonly<Record<string, any>>;

export async function getSite() {
  const site = await db.fetch<Site>(['site']);
  const articles = filter((await db.fetch<Article[]>(['articles'])) || [], { published: true });

  if (!site) {
    throw new Error('no site info in db.json');
  }

  site.articles = articles;
  site.generatedAt = Date.now();

  return site as Required<Site>;
}

export async function getThemeData(themeName: string) {
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

export async function copyAssets(themeName: string) {
  const themeDir = await getThemeDir(themeName);
  const dataDir = await joplin.plugins.dataDir();
  const assetsPath = `${themeDir}/_assets`;

  await copy(assetsPath, `${dataDir}/output/_assets`);
}

export async function getJoplinMarkdownSetting() {
  // @see https://github.com/laurent22/joplin/blob/1bc674a1f9a1f5021142d040459ef127db71ee62/packages/lib/models/Setting.ts#L873
  const pluginNames = [
    'softbreaks',
    'typographer',
    'linkify',
    'katex',
    'fountain',
    'mermaid',
    'mark',
    'footnote',
    'toc',
    'sub',
    'sup',
    'deflist',
    'abbr',
    'emoji',
    'insert',
    'multitable',
  ];

  const values = await Promise.all<boolean>(
    pluginNames.map((name) => joplin.settings.globalValue(`markdown.plugin.${name}`)),
  );

  return values.reduce((result, value, i) => {
    if (value) {
      result[pluginNames[i]] = {};
    }

    return result;
  }, {} as Record<string, unknown>);
}
