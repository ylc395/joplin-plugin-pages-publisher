import { Field } from './Page';

type PageName = string;

export const DEFAULT_THEME_NAME = 'Default';

export interface Theme {
  readonly name: string; // no need in config.js
  readonly author?: string;
  readonly version?: string;
  readonly pages: Readonly<Record<PageName, Field[] | undefined>>;
  readonly siteFields?: Readonly<Field[]>;
  readonly articleFields?: Readonly<Field[]>;
}
