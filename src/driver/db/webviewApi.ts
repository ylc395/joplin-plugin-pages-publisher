import { container } from 'tsyringe';
import { pluginDataDbToken, PluginDataDb } from 'domain/repository/PluginDataRepository';
import fs from 'driver/fs/webviewApi';
import joplin from 'driver/joplin/webviewApi';

export interface DbReadRequest {
  event: 'dbFetch';
  args: Parameters<PluginDataDb['fetch']>;
}

export interface DbWriteRequest {
  event: 'dbSave';
  args: Parameters<PluginDataDb['save']>;
}

declare const webviewApi: {
  postMessage: <T>(payload: DbReadRequest | DbWriteRequest) => Promise<T>;
};

container.registerInstance(pluginDataDbToken, {
  async fetch<T>(path: string[]) {
    return webviewApi.postMessage<T>({ event: 'dbFetch', args: [path] });
  },
  save(path: string[], value: unknown) {
    return webviewApi.postMessage<void>({ event: 'dbSave', args: [path, value] });
  },

  async fetchIcon() {
    const dataDir = await joplin.dataDir();
    const iconDir = `${dataDir}/favicon.ico`;
    try {
      return (await fs.promises.readFile(iconDir)) as unknown as Uint8Array;
    } catch {
      return null;
    }
  },

  async saveIcon(icon: Uint8Array | null | undefined) {
    const dataDir = await joplin.dataDir();
    const iconPath = `${dataDir}/favicon.ico`;

    if (!icon) {
      return await fs.promises.remove(iconPath);
    }

    return await fs.promises.writeFile(iconPath, icon);
  },
});
