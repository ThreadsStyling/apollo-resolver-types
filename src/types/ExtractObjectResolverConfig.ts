import ExtractPropsWithType from './ExtractPropsWithType';
import MakePropsRequired from './MakePropsRequired';

/**
 * Take the resolvers and extract just the object type resolvers, marking any
 * that are needed as required
 */
type ExtractObjectResolverConfig<Resolvers> = ExtractPropsWithType<MakePropsRequired<Resolvers>, Record<any, any>>;
export default ExtractObjectResolverConfig;
