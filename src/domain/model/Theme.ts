import type { Field } from './Page';

type PageName = string;
export interface Theme {
  readonly name: string;
  readonly author: string;
  readonly version: string;
  readonly pages: Readonly<Record<PageName, Field[] | undefined>>;
}
