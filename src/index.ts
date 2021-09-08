import 'core-js/proposals/reflect-metadata';
import joplin from 'api';
import webviewBridge from './driver/webviewBridge';

const OPEN_PAGES_PUBLISHER_COMMAND = 'openPagesPublisher';
const panels = joplin.views.panels;
let mainWindow: string;

joplin.plugins.register({
  onStart: async function () {
    await joplin.commands.register({
      name: OPEN_PAGES_PUBLISHER_COMMAND,
      label: 'Pages Publisher',
      async execute() {
        if (!mainWindow) {
          mainWindow = await panels.create('mainWindow');
          panels.onMessage(mainWindow, webviewBridge(mainWindow));
          await panels.addScript(mainWindow, './driver/webview/module-polyfill.js');
          await panels.addScript(mainWindow, './driver/webview/index.js');
        }
        await panels.show(mainWindow);
      },
    });

    await joplin.views.menuItems.create('pages-publisher', OPEN_PAGES_PUBLISHER_COMMAND);
  },
});
