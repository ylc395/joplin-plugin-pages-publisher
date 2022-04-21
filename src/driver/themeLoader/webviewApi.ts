import { container } from 'tsyringe';
import { themeLoaderToken } from 'domain/repository/PluginDataRepository';
import type { Theme } from 'domain/model/Theme';

interface ThemeConfigLoadRequest {
  event: 'loadThemeConfig';
  themeName: string;
}

interface ThemeConfigsLoadRequest {
  event: 'loadThemeConfigs';
}

export type ThemeConfigRequest = ThemeConfigLoadRequest | ThemeConfigsLoadRequest;

declare const webviewApi: {
  postMessage: <T>(payload: ThemeConfigRequest) => Promise<T>;
};

container.registerInstance(themeLoaderToken, {
  fetch(themeName: string) {
    return webviewApi.postMessage<Theme>({ event: 'loadThemeConfig', themeName });
  },
  fetchAll() {
    return webviewApi.postMessage<Theme[]>({ event: 'loadThemeConfigs' });
  },
});
