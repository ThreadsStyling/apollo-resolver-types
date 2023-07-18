import * as ta from 'type-assertions';
import RequiredResolvers from './RequiredResolvers';

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
  __isTypeOf?: (
    parent: {foo: string; baz: string | null},
    args: {y: string},
    context: {z: string},
    info: {a: string},
  ) => Promise<boolean> | boolean;
  __resolveReference?: (
    parent: {foo: string; baz: string | null},
    context: {z: string},
    info: {a: string},
  ) => Promise<{foo: string; baz: string | null}> | {foo: string; baz: string | null};
};

// eslint-disable-next-line @typescript-eslint/ban-types
ta.assert<ta.Equal<RequiredResolvers<Object>, 'bar' | 'baz'>>();

type RequiresResolveReference = {
  __resolveReference?: (
    parent: {id: number},
    context: {z: string},
    info: {a: string},
  ) => Promise<{id: number; foo: string; baz: string | null}> | {id: number; foo: string; baz: string | null};
};

ta.assert<ta.Equal<RequiredResolvers<RequiresResolveReference>, '__resolveReference'>>();
