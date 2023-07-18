import * as ta from 'type-assertions';
import OptionalResolvers from './OptionalResolvers';

type Object = {
  foo?: (
    parent: {foo: string; baz: string | null},
    args: {y: string},
    context: {z: string},
    info: {a: string},
  ) => Promise<string> | string;
  bar?: (
    parent: {foo: string; baz: string | null},
    args: {y: string},
    context: {z: string},
    info: {a: string},
  ) => Promise<string> | string;
  baz?: (
    parent: {foo: string; baz: string | null},
    args: {y: string},
    context: {z: string},
    info: {a: string},
  ) => Promise<string> | string;
};
// eslint-disable-next-line @typescript-eslint/ban-types
ta.assert<ta.Equal<OptionalResolvers<Object>, 'foo'>>();
