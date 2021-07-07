import joplin from 'api';
import type { readJSON as IReadJSON, readdir as IReaddir } from 'fs-extra';

const { readJson, readdir } = joplin.require('fs-extra') as {
  readJson: typeof IReadJSON;
  readdir: typeof IReaddir;
};

export async function loadTheme(themeName: string) {
  const pluginDir = await joplin.plugins.dataDir();
  try {
    const res = await readJson(`${pluginDir}/themes/${themeName}/config.json`);
    return res;
  } catch (err) {
    console.warn(err);
    return null;
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
    for (const result of results) {
      if (result.status === 'fulfilled') {
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
