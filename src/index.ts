import 'core-js/proposals/reflect-metadata';
import joplinApi from 'api';
import Joplin from 'driver/joplin/joplinPlugin';

const joplin = new Joplin();

joplinApi.plugins.register({
  onStart: async function () {
    await joplin.setupSettings();
    await joplin.setupCommand();
    await joplin.setupMenu();
  },
});
