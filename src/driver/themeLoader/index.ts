import joplin from 'api';
import Ajv from 'ajv';
import type { readJSON as IReadJSON, readdir as IReaddir } from 'fs-extra';

const { readJson, readdir } = joplin.require('fs-extra') as {
  readJson: typeof IReadJSON;
  readdir: typeof IReaddir;
};

const FIELD_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
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
    version: { type: 'string' },
    pages: { type: 'object', additionalProperties: { type: 'array', items: FIELD_SCHEMA } },
  },
  required: ['version', 'pages'],
} as const;

const themeValidate = new Ajv().compile<any>(THEME_SCHEMA);

export async function loadTheme(themeName: string) {
  const pluginDir = await joplin.plugins.dataDir();
  try {
    const res = await readJson(`${pluginDir}/themes/${themeName}/config.json`);

    if (!themeValidate(res)) {
      const errMsg = themeValidate.errors
        ?.map(({ message, instancePath }) => `${instancePath}: ${message}`)
        .join('\n');
      throw new Error(`Invalid config.json: ${errMsg}`);
    }
    return res;
  } catch (err) {
    console.warn(err);
    return err.message;
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

    const themes = [];
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
    return [];
  }
}
