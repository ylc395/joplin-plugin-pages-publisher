import joplin from 'api';
import { Db } from './driver/db';
import webviewHandler from './webviewHandler';

const OPEN_PAGES_PUBLISHER_COMMAND = 'openPagesPublisher';
const panels = joplin.views.panels;

joplin.plugins.register({
  onStart: async function () {
    const db = new Db();

    await joplin.commands.register({
      name: OPEN_PAGES_PUBLISHER_COMMAND,
      label: 'Pages Publisher',
      async execute() {
        const mainWindow = await panels.create('mainWindow');

        panels.onMessage(mainWindow, webviewHandler(db));

        await panels.addScript(mainWindow, './driver/webview/module-polyfill.js');
        await panels.addScript(mainWindow, './driver/webview/index.js');
        await panels.show(mainWindow);
      },
    });

    await joplin.views.menuItems.create('pages-publisher', OPEN_PAGES_PUBLISHER_COMMAND);
  },
});
