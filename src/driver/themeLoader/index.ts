import joplin from 'api';
import Ajv from 'ajv';
import isValidFilename from 'valid-filename';
import type { readJSON as IReadJSON, readdir as IReaddir } from 'fs-extra';
import type { Theme } from '../../domain/model/Theme';
import { DEFAULT_THEME_NAME } from '../../domain/model/Theme';
import { THEME_SCHEMA } from './schema';

const { readJson, readdir } = joplin.require('fs-extra') as {
  readJson: typeof IReadJSON;
  readdir: typeof IReaddir;
};

const themeValidate = new Ajv()
  .addFormat('validPageUrl', (str) => isValidFilename(str) && !str.startsWith('_'))
  .compile<Theme>(THEME_SCHEMA);

async function loadDefault(): Promise<Theme> {
  const installDir = await joplin.plugins.installationDir();
  return readJson(`${installDir}/assets/defaultTheme/config.json`);
}

export async function loadTheme(themeName: string) {
  if (themeName === DEFAULT_THEME_NAME) {
    return loadDefault();
  }

  const pluginDir = await joplin.plugins.dataDir();
  try {
    const res = await readJson(`${pluginDir}/themes/${themeName}/config.json`);
    res.name = res.name || themeName;

    if (!themeValidate(res)) {
      const errMsg = themeValidate.errors
        ?.map(({ message, instancePath }) => `${instancePath}: ${message}`)
        .join(`\n${' '.repeat(4)}`);
      throw new Error(`Invalid config.json: \n${' '.repeat(4)}${errMsg}`);
    }
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
