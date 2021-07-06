import joplin from 'api';

const fs = joplin.require('fs-extra');

export default async function (themeName: string) {
  const pluginDir = await joplin.plugins.dataDir();
  const res = await fs.readJson(`${pluginDir}/themes/${themeName}/config.json`);
  return res;
}
