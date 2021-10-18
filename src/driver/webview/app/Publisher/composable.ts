import { token as appToken } from 'domain/service/AppService';
import { inject } from 'vue';

export function useModalProps() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { getRootEl } = inject(appToken)!;

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
