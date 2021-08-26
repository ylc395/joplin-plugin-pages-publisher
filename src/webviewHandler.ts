import { container } from 'tsyringe';
import joplin from 'api';
import { Db } from './driver/db';
import type { DbReadRequest, DbWriteRequest } from './driver/db/webviewApi';
import type { JoplinDataRequest } from './driver/joplinApi';
import type { AppRequest } from './driver/webview/utils/webviewApi';
import type {
  ThemeConfigLoadRequest,
  ThemeConfigsLoadRequest,
} from './driver/themeLoader/webviewApi';
import { loadTheme, loadThemes } from './driver/themeLoader';
import generateSite from './driver/generator';

export default (panelId: string) => {
  const db = container.resolve(Db);

  return (
    request:
      | DbReadRequest
      | DbWriteRequest
      | JoplinDataRequest
      | ThemeConfigLoadRequest
      | ThemeConfigsLoadRequest
      | AppRequest,
  ) => {
    switch (request.event) {
      case 'dbFetch':
        return db.fetch(...request.args);
      case 'dbSave':
        return db.save(...request.args);
      case 'getJoplinData':
        return joplin.data.get(...request.args);
      case 'loadThemeConfig':
        return loadTheme(request.themeName);
      case 'loadThemeConfigs':
        return loadThemes();
      case 'quitApp':
        joplin.views.panels.hide(panelId);
        return;
      case 'generateSite':
        generateSite();
        return;
      default:
        break;
    }
  };
};
