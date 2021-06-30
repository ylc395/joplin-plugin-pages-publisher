import type { Field } from './Page';

type PageName = string;

export interface Theme {
  name: string;
  author: string;
  homepage: string;
  pages: Record<PageName, Field[]>;
}
