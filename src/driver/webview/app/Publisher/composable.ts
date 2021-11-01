import { getRootEl } from 'driver/webview/utils/webviewApi';

export function useModalProps() {
  return {
    mask: false,
    closable: false,
    footer: null,
    width: '400px',
    getContainer: getRootEl,
    // todo: there is a transition bug in Modal. disable transition
    transitionName: 'null',
  };
}
