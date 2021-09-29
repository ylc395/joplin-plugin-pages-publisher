import joplin from 'api';
import Ajv from 'ajv';
import isValidFilename from 'valid-filename';
import type { Theme } from 'domain/model/Theme';
import { DEFAULT_THEME_NAME } from 'domain/model/Theme';
import { getThemeDir } from 'driver/generator/joplinPlugin/pathHelper';
import { getValidator } from 'driver/utils';
import fs from 'driver/fs/joplinPlugin';
import { THEME_SCHEMA } from './schema';

const themeValidator = new Ajv()
  .addFormat(
    'validPageName',
    (str) => isValidFilename(str) && !str.startsWith('_') && str !== 'rss',
  )
  .compile<Theme>(THEME_SCHEMA);

const validateTheme: (data: unknown) => asserts data is Theme = getValidator(
  themeValidator,
  'Invalid config.js',
);

async function loadDefault(): Promise<Theme> {
  const theme = await fs.readJson(`${await getThemeDir(DEFAULT_THEME_NAME)}/config.json`);
  theme.name = DEFAULT_THEME_NAME;

  return theme;
}

export async function loadTheme(themeName: string) {
  if (themeName === DEFAULT_THEME_NAME) {
    return loadDefault();
  }

  const pluginDir = await joplin.plugins.dataDir();
  try {
    const res = await fs.readJson(`${pluginDir}/themes/${themeName}/config.json`);
    res.name = res.name || themeName;
    validateTheme(res);
    return res;
  } catch (err) {
    console.warn(err);
    throw err;
  }
}

export async function loadThemes() {
  const pluginDir = await joplin.plugins.dataDir();
  await fs.ensureDir(`${pluginDir}/themes`);

  try {
    const files = await fs.readdir(`${pluginDir}/themes`, { withFileTypes: true });
    const subDirectories = files.filter((file) => file.isDirectory()).map(({ name }) => name);
    const results = await Promise.allSettled(
      subDirectories.map((name) => fs.readJson(`${pluginDir}/themes/${name}/config.json`)),
    );

    const themes = [await loadDefault()];
    for (const [i, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        result.value.name = result.value.name || subDirectories[i];
        themes.push(result.value);
      } else {
        console.warn(result.reason);
      }
    }

    return themes;
  } catch (err) {
    console.warn(err);
    throw err;
  }
}
