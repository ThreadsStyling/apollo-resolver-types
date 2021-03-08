import * as ta from 'type-assertions';
import ThenArg from './ThenArg';

ta.assert<ta.Equal<ThenArg<string>, string>>();
ta.assert<ta.Equal<ThenArg<{test: string}>, {test: string}>>();
ta.assert<ta.Equal<ThenArg<Promise<string>>, string>>();
ta.assert<ta.Equal<ThenArg<Promise<{test: string}>>, {test: string}>>();
