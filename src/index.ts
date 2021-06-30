import joplin from 'api';
import { Db } from './driver/db';
import type {
  JoplinDataRequest,
  DbDataRequest,
  PageConfigRequest,
} from './driver/webviewApi';

const OPEN_PAGES_PUBLISHER_COMMAND = 'openPagesPublisher';
const panels = joplin.views.panels;
const fs = joplin.require('fs-extra');

joplin.plugins.register({
  onStart: async function () {
    const db = new Db();
    await db.init();

    await joplin.commands.register({
      name: OPEN_PAGES_PUBLISHER_COMMAND,
      label: 'Pages Publisher',
      async execute() {
        const mainWindow = await panels.create('mainWindow');
        const pluginDir = await joplin.plugins.dataDir();

        panels.onMessage(
          mainWindow,
          (request: JoplinDataRequest | DbDataRequest | PageConfigRequest) => {
            switch (request.event) {
              case 'getJoplinData':
                return joplin.data.get(...request.args);
              case 'getDbData':
                return db.read(request.path);
              case 'getPageConfig':
                return fs.readJson(
                  `${pluginDir}/theme/pages/${request.page}.json`,
                );
              case 'saveDbData':
                // eslint-disable-next-line no-case-declarations
                const { payload } = request;

                if (payload.dataType === 'pages') {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  db.data!.theme[payload.data.theme][payload.data.page] =
                    payload.data.values;
                } else {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  db.data![payload.dataType] = payload.data;
                }
                return db.write();
              default:
                break;
            }
          },
        );

        await panels.addScript(
          mainWindow,
          './driver/webview/module-polyfill.js',
        );
        await panels.addScript(mainWindow, './driver/webview/index.js');
        await panels.show(mainWindow);
      },
    });

    await joplin.views.menuItems.create(
      'pages-publisher',
      OPEN_PAGES_PUBLISHER_COMMAND,
    );
  },
});
