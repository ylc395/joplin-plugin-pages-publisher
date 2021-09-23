import { container } from 'tsyringe';
import joplin from 'api';
import { Db } from 'driver/db/joplinPlugin';
import type { DbReadRequest, DbWriteRequest } from 'driver/db/webviewApi';
import type { JoplinDataRequest, JoplinPluginSettingRequest } from 'driver/joplinData/webviewApi';
import type { JoplinAction } from 'driver/joplin/webviewApi';
import type { GitRequest } from 'driver/git/webviewApi';
import type { FsRequest } from 'driver/fs/webviewApi';
import type { GeneratorRequest } from 'driver/generator/webviewApi';
import type {
  ThemeConfigLoadRequest,
  ThemeConfigsLoadRequest,
} from 'driver/themeLoader/webviewApi';

import { loadTheme, loadThemes } from 'driver/themeLoader/joplinPlugin';
import { generateSite, getProgress } from 'driver/generator/joplinPlugin';
import { getOutputDir, getGitRepositoryDir } from 'driver/generator/joplinPlugin/pathHelper';
import { fetchData, fetchAllData } from 'driver/joplinData/joplinPlugin';
import { mockNodeFsCall } from 'driver/fs/joplinPlugin';

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
      | JoplinAction,
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
        return joplin.views.panels.hide(panelId);
      case 'installationDir':
        return joplin.plugins.installationDir();
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
