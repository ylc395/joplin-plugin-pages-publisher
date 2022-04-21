import type { DbRequest } from 'driver/db/webviewApi';
import type { JoplinRequest } from 'driver/joplin/webviewApi';
import type { GitRequest } from 'driver/git/webviewApi';
import type { FsRequest } from 'driver/fs/webviewApi';
import type { GeneratorRequest } from 'driver/generator/webviewApi';
import type { ThemeConfigRequest } from 'driver/themeLoader/webviewApi';
import type { ServerRequest } from 'driver/server/webviewApi';

import { loadTheme, loadThemes } from 'driver/themeLoader/joplinPlugin';
import { getOutputDir, getGitRepositoryDir } from 'driver/generator/joplinPlugin/pathHelper';
import { mockNodeFsCall } from 'driver/fs/joplinPlugin';
import type Joplin from 'driver/joplin/joplinPlugin';

export default (joplin: Joplin) => {
  return (
    request:
      | DbRequest
      | JoplinRequest
      | ThemeConfigRequest
      | FsRequest
      | GeneratorRequest
      | GitRequest
      | ServerRequest,
  ) => {
    switch (request.event) {
      case 'dbFetch':
        return joplin.db.fetch(...request.args);
      case 'dbSave':
        return joplin.db.save(...request.args);
      case 'fetchIcon':
        return joplin.db.fetchIcon();
      case 'saveIcon':
        return joplin.db.saveIcon(request.payload.icon);
      case 'getJoplinData':
        return joplin.fetchData(...request.args);
      case 'getJoplinDataAll':
        return joplin.fetchAllData(...request.args);
      case 'loadThemeConfig':
        return loadTheme(request.themeName);
      case 'loadThemeConfigs':
        return loadThemes();
      case 'quit':
        return joplin.quit();
      case 'getInstallationDir':
        return joplin.getInstallationDir();
      case 'getDataDir':
        return joplin.getDataDir();
      case 'getWindowSize':
        return joplin.getWindowSize();
      case 'isNewUser':
        return joplin.isNewUser();
      case 'setAsOldUser':
        return joplin.setAsOldUser();
      case 'generateSite':
        return joplin.generator.generateSite();
      case 'getGeneratingProgress':
        return joplin.generator.getProgress();
      case 'openNote':
        return joplin.openNote(request.payload);
      case 'getOutputDir':
        return getOutputDir();
      case 'getGitRepositoryDir':
        return getGitRepositoryDir();
      case 'fsCall':
        return mockNodeFsCall(request.funcName, ...request.args);
      case 'getJoplinPluginSetting':
        return joplin.getSettingOf(request.key);
      case 'startServer':
        return joplin.httpServer.start();
      case 'closeServer':
        return joplin.httpServer.close();
      default:
        throw new Error(`unknown bridge request: ${request}`);
    }
  };
};
