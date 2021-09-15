export function useModalProps() {
  return {
    mask: false,
    closable: false,
    footer: null,
    width: '400px',
    getContainer: () => document.querySelector('#joplin-plugin-content'),
  };
}
