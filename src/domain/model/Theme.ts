import type { Field } from './Page';

type PageName = string;

export class Theme {
  readonly name: string = '';
  readonly author: string = '';
  readonly document: string = '';
  readonly pages: Readonly<Record<PageName, Field[]>> = {};
  isValid() {
    if (this.pages) {
    }
  }
}
