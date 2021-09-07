import 'core-js/proposals/reflect-metadata';
import 'tailwindcss/tailwind.css';
import { createApp } from 'vue';
import EventEmitter from 'eventemitter3';
import { container } from 'tsyringe';
import '../db/webviewApi';
import '../themeLoader/webviewApi';
import '../joplinApi/webviewApi';
import App from './app/index.vue';
import { ExceptionService } from '../../domain/service/ExceptionService';

declare global {
  interface Window {
    appEventBus: EventEmitter;
  }
}

window.appEventBus = new EventEmitter();
const app = createApp(App);
const exceptionService = container.resolve(ExceptionService);
app.config.errorHandler = (err: unknown) => {
  exceptionService.reportError(err as Error);
};

app.mount('#joplin-plugin-content');
