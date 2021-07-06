import { container } from 'tsyringe';
import { themeFetcherToken } from '../../domain/repository/PluginDataRepository';
import type { Theme } from '../../domain/model/Site';

export interface ThemeConfigLoadRequest {
  event: 'loadThemeConfig';
  themeName: string;
}

declare const webviewApi: {
  postMessage: <T>(payload: ThemeConfigLoadRequest) => Promise<T>;
};

container.registerInstance(themeFetcherToken, {
  fetch(themeName: string) {
    webviewApi.postMessage<Theme>({ event: 'loadThemeConfig', themeName });
  },
});
