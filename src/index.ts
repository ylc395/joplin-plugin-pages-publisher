import 'core-js/proposals/reflect-metadata';
import joplin from 'api';
import { SettingItemType } from 'api/types';
import webviewBridge from './driver/webview/webviewBridge';

const OPEN_PAGES_PUBLISHER_COMMAND = 'openPagesPublisher';
const panels = joplin.views.panels;
let mainWindow: string;

joplin.plugins.register({
  onStart: async function () {
    await registerSettings();
    await joplin.commands.register({
      name: OPEN_PAGES_PUBLISHER_COMMAND,
      label: 'Open Pages Publisher',
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

async function registerSettings() {
  const SECTION_NAME = 'github';

  await joplin.settings.registerSection(SECTION_NAME, {
    label: 'Page Publisher',
  });

  await joplin.settings.registerSettings({
    githubToken: {
      label: 'Github Token',
      secure: true,
      type: SettingItemType.String,
      public: true,
      value: '',
      section: SECTION_NAME,
      description:
        'See https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token for details',
    },
  });
}
