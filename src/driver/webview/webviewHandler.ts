import { container } from 'tsyringe';
import joplin from 'api';
import { Db } from '../db';
import type { DbReadRequest, DbWriteRequest } from '../db/webviewApi';
import type { JoplinDataRequest } from '../joplinApi/webviewApi';
import type { AppRequest } from './utils/webviewApi';
import type { ThemeConfigLoadRequest, ThemeConfigsLoadRequest } from '../themeLoader/webviewApi';
import { loadTheme, loadThemes } from '../themeLoader';
import generateSite from '../generator';
import { fetchData, fetchAllData } from '../joplinApi';

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
      default:
        break;
    }
  };
};
