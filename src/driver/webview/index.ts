import 'core-js/proposals/reflect-metadata';
import { createApp } from 'vue';
import '../db/webviewApi';
import '../themeLoader/webviewApi';
import '../joplinApi';
import App from './App.vue';

createApp(App).mount('#joplin-plugin-content');
