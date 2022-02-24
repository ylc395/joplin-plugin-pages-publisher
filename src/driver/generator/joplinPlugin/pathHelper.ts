import { DEFAULT_THEME_NAME } from 'domain/model/Theme';
import joplin from 'api';

export async function getThemeDir(themeName: string) {
  const themeDir =
    themeName === DEFAULT_THEME_NAME
      ? `${await joplin.plugins.installationDir()}/assets/default_theme`
      : `${await joplin.plugins.dataDir()}/themes/${themeName}`;

  return themeDir;
}

export async function getOutputDir() {
  return `${await joplin.plugins.dataDir()}/output`;
}

export async function getMarkdownPluginAssetsDir() {
  return `${await joplin.plugins.installationDir()}/assets/markdown_plugin_assets`;
}

export async function getIcon() {
  return `${await joplin.plugins.dataDir()}/favicon.ico`;
}

export function getOutputIcon(outputDir: string) {
  return `${outputDir}/favicon.ico`;
}

export function getOutputNoJekyll(outputDir: string) {
  return `${outputDir}/.nojekyll`;
}

export function getOutputThemeAssetsDir(outputDir: string) {
  return `${outputDir}/_assets`;
}

export async function getGitRepositoryDir() {
  return `${await joplin.plugins.dataDir()}/git_repository`;
}
