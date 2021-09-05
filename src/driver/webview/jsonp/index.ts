import JoplinViewsPanels from 'api/JoplinViewsPanels';
import { uniqueId } from 'lodash';

export function onNoteChange(panels: JoplinViewsPanels, mainWindow: string) {
  return ({ id }: { id: string }) => {
    panels.addScript(
      mainWindow,
      // hack: this is a invalid URL, but we can use it to pass noteId to webview
      `./driver/webview/jsonp/onNoteChange.js?id=${id}&_=${uniqueId('noteChange')}.js`,
    );
  };
}
