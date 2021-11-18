import 'core-js/proposals/reflect-metadata';
import 'tailwindcss/tailwind.css';
import { createApp } from 'vue';
import { container } from 'tsyringe';
import 'driver/db/webviewApi';
import 'driver/themeLoader/webviewApi';
import 'driver/generator/webviewApi';
import 'driver/joplin/webviewApi';
import 'driver/git/webviewApi';
import 'driver/github/webviewApi';
import 'driver/server/webviewApi';
import './utils/webviewApi';
import App from './app/index.vue';
import { ExceptionService } from 'domain/service/ExceptionService';
import { AppService } from 'domain/service/AppService';
import { getRootEl } from 'driver/webview/utils/webviewApi';

const exceptionService = container.resolve(ExceptionService);
const appService = container.resolve(AppService);

appService
  .init()
  .then(() => {
    return appService.checkDb();
  })
  .then(() => {
    const app = createApp(App);
    app.config.errorHandler = (err: unknown) => {
      exceptionService.reportError(err as Error);
    };

    app.mount(getRootEl());
  });
