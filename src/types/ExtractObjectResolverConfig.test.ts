import * as ta from 'type-assertions';
import ExtractObjectResolverConfig from './ExtractObjectResolverConfig';

type IResolvers = {
  Query?: {
    contacts?: (
      parent: {foo: string; baz: string | null},
      args: {y: string},
      context: {z: string},
      info: {a: string},
    ) => Promise<{name: string}[]> | {name: string}[];
  };
  scalar?: string;
};

ta.assert<
  ta.Equal<
    ExtractObjectResolverConfig<IResolvers>,
    {
      Query: {
        contacts?: (
          parent: {foo: string; baz: string | null},
          args: {y: string},
          context: {z: string},
          info: {a: string},
        ) => Promise<{name: string}[]> | {name: string}[];
      };
    }
  >
>();
