import joplin from 'api';
import type { Db } from './driver/db';
import type { DbReadRequest, DbWriteRequest } from './driver/db/webviewApi';
import type { JoplinDataRequest } from './driver/joplinApi';
import type { ThemeConfigLoadRequest } from './driver/themeLoader/webviewApi';
import loadTheme from './driver/themeLoader';

export default (db: Db) =>
  (request: DbReadRequest | DbWriteRequest | JoplinDataRequest | ThemeConfigLoadRequest) => {
    switch (request.event) {
      case 'dbFetch':
        return db.fetch(...request.args);
      case 'dbSave':
        return db.save(...request.args);
      case 'getJoplinData':
        return joplin.data.get(...request.args);
      case 'loadThemeConfig':
        return loadTheme(request.themeName);
      default:
        break;
    }
  };
