export interface AppRequest {
  event: 'quitApp' | 'generateSite' | 'openNote';
  payload?: any;
}

declare const webviewApi: {
  postMessage: (payload: AppRequest) => Promise<void>;
};

export function quitApp() {
  webviewApi.postMessage({ event: 'quitApp' });
}

export function generateSite() {
  return webviewApi.postMessage({ event: 'generateSite' });
}

export function openNote(noteId: string) {
  webviewApi.postMessage({ event: 'openNote', payload: noteId });
}
