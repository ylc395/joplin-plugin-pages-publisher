import { DEFAULT_THEME_NAME } from '../../domain/model/Theme';
import joplin from 'api';

export async function getThemeDir(themeName: string) {
  const themeDir =
    themeName === DEFAULT_THEME_NAME
      ? `${await joplin.plugins.installationDir()}/assets/defaultTheme`
      : `${await joplin.plugins.dataDir()}/themes/${themeName}`;

  return themeDir;
}

export async function getOutputDir() {
  const dataDir = await joplin.plugins.dataDir();
  return `${dataDir}/output`;
}

export async function getMarkdownPluginAssetsDir() {
  return `${await joplin.plugins.installationDir()}/assets/markdownPluginAssets`;
}

export function getThemeAssetsDir(themeDir: string) {
  return `${themeDir}/_assets`;
}

export function getOutputThemeAssetsDir(outputDir: string) {
  return `${outputDir}/_assets`;
}
