import {IResolverObject} from 'graphql-tools';
import ExtractPropsWithType from './ExtractPropsWithType';
import MakePropsRequired from './MakePropsRequired';

/**
 * Take the resolvers and extract just the object type resolvers, marking any
 * that are needed as required
 */
type ExtractObjectResolverConfig<Resolvers> = ExtractPropsWithType<
  MakePropsRequired<Resolvers>,
  IResolverObject<any, any>
>;
export default ExtractObjectResolverConfig;
