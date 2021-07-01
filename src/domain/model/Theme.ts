import { container, InjectionToken } from 'tsyringe';
import type { Field } from './Page';

export interface Theme {
  readonly name: string;
  readonly author: string;
  readonly pages: Readonly<Record<string, Field[]>>;
}
export const token: InjectionToken<Theme> = Symbol();
export default container.resolve(token);
