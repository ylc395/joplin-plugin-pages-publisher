import joplin from 'api';
import { Db } from './driver/db';
import type { DbReadRequest, DbWriteRequest } from './driver/db/webviewApi';
import type { JoplinDataRequest } from './driver/joplinApi';
import type {
  ThemeConfigLoadRequest,
  ThemeConfigsLoadRequest,
} from './driver/themeLoader/webviewApi';
import { loadTheme, loadThemes } from './driver/themeLoader';

export default (panelId: string) => {
  const db = new Db();

  return (
    request:
      | DbReadRequest
      | DbWriteRequest
      | JoplinDataRequest
      | ThemeConfigLoadRequest
      | ThemeConfigsLoadRequest
      | { event: 'quitApp' },
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
      default:
        break;
    }
  };
};
