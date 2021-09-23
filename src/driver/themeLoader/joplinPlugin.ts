import joplin from 'api';
import Ajv from 'ajv';
import isValidFilename from 'valid-filename';
import type { readJSON as IReadJSON, readdir as IReaddir } from 'fs-extra';
import type { Theme } from 'domain/model/Theme';
import { DEFAULT_THEME_NAME } from 'domain/model/Theme';
import { getThemeDir } from 'driver/generator/joplinPlugin/pathHelper';
import { getValidator } from 'driver/utils';
import { THEME_SCHEMA } from './schema';

const { readJson, readdir } = joplin.require('fs-extra') as {
  readJson: typeof IReadJSON;
  readdir: typeof IReaddir;
};

const themeValidator = new Ajv()
  .addFormat('validPageUrl', (str) => isValidFilename(str) && !str.startsWith('_'))
  .compile<Theme>(THEME_SCHEMA);

const validateTheme: (data: unknown) => asserts data is Theme = getValidator(
  themeValidator,
  'Invalid config.js',
);

async function loadDefault(): Promise<Theme> {
  return readJson(`${await getThemeDir(DEFAULT_THEME_NAME)}/config.json`);
}

export async function loadTheme(themeName: string) {
  if (themeName === DEFAULT_THEME_NAME) {
    return loadDefault();
  }

  const pluginDir = await joplin.plugins.dataDir();
  try {
    const res = await readJson(`${pluginDir}/themes/${themeName}/config.json`);
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
  try {
    const files = await readdir(`${pluginDir}/themes`, { withFileTypes: true });
    const subDirectories = files.filter((file) => file.isDirectory()).map(({ name }) => name);
    const results = await Promise.allSettled(
      subDirectories.map((name) => readJson(`${pluginDir}/themes/${name}/config.json`)),
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
