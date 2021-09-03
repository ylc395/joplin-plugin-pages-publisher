import joplin from 'api';
import Ajv from 'ajv';
import type { readJSON as IReadJSON, readdir as IReaddir } from 'fs-extra';
import type { Theme } from '../../domain/model/Theme';
import { DEFAULT_THEME_NAME } from '../../domain/model/Theme';

const { readJson, readdir } = joplin.require('fs-extra') as {
  readJson: typeof IReadJSON;
  readdir: typeof IReaddir;
};

const FIELD_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', pattern: '^[^_]' },
    label: { type: 'string' },
    tip: { type: 'string' },
    required: { type: 'boolean' },
    inputType: {
      enum: [
        'input',
        'select',
        'multiple-select',
        'textarea',
        'radio',
        'switch',
        'image-picker',
        'number',
        'checkbox',
        'date',
      ],
    },
  },
  required: ['name'],
} as const;

const THEME_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    version: { type: 'string' },
    pages: {
      type: 'object',
      additionalProperties: { type: 'array', items: FIELD_SCHEMA },
      propertyNames: { pattern: '^[^_]' },
    },
    siteFields: { type: 'array', items: FIELD_SCHEMA },
    articleFields: { type: 'array', items: FIELD_SCHEMA },
  },
  required: ['name', 'version', 'pages'],
} as const;

const themeValidate = new Ajv().compile<Theme>(THEME_SCHEMA);

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
