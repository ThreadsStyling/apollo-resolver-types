import * as ta from 'type-assertions';
import MakeOptionalWhenNoRequiredResolvers from './MakeOptionalWhenNoRequiredResolvers';

ta.assert<
  ta.Equal<
    MakeOptionalWhenNoRequiredResolvers<{
      x: object;
      y: {a: true};
    }>,
    {
      x?: object;
      y: {a: true};
    }
  >
>();
