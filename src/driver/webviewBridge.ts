import { container } from 'tsyringe';
import joplin from 'api';
import { Db } from './db/joplinPlugin';
import type { DbReadRequest, DbWriteRequest } from './db/webviewApi';
import type { JoplinDataRequest, JoplinPluginSettingRequest } from './joplinData/webviewApi';
import type { AppRequest } from './webview/utils/webviewApi';
import type { GitRequest } from './git/webviewApi';
import type { FsRequest } from './fs/webviewApi';
import type { GeneratorRequest } from './generator/webviewApi';
import type { ThemeConfigLoadRequest, ThemeConfigsLoadRequest } from './themeLoader/webviewApi';

import { loadTheme, loadThemes } from './themeLoader/joplinPlugin';
import { generateSite, getProgress } from './generator';
import { getOutputDir, getGitRepositoryDir } from './generator/pathHelper';
import { fetchData, fetchAllData } from './joplinData/joplinPlugin';
import { mockNodeFsCall } from './fs/joplinPlugin';

export default (panelId: string) => {
  const db = container.resolve(Db);

  return (
    request:
      | DbReadRequest
      | DbWriteRequest
      | JoplinDataRequest
      | JoplinPluginSettingRequest
      | ThemeConfigLoadRequest
      | ThemeConfigsLoadRequest
      | FsRequest
      | GeneratorRequest
      | GitRequest
      | AppRequest,
  ) => {
    switch (request.event) {
      case 'dbFetch':
        return db.fetch(...request.args);
      case 'dbSave':
        return db.save(...request.args);
      case 'getJoplinData':
        return fetchData(...request.args);
      case 'getJoplinDataAll':
        return fetchAllData(...request.args);
      case 'loadThemeConfig':
        return loadTheme(request.themeName);
      case 'loadThemeConfigs':
        return loadThemes();
      case 'quitApp':
        joplin.views.panels.hide(panelId);
        return;
      case 'generateSite':
        return generateSite();
      case 'getGeneratingProgress':
        return getProgress();
      case 'openNote':
        return joplin.commands.execute('openNote', request.payload);
      case 'getOutputDir':
        return getOutputDir();
      case 'getGitRepositoryDir':
        return getGitRepositoryDir();
      case 'fsCall':
        return mockNodeFsCall(request.funcName, ...request.args);
      case 'getJoplinPluginSetting':
        return joplin.settings.value(request.key);
      default:
        break;
    }
  };
};
