import {GraphQLScalarType} from 'graphql';
import ExtractPropsWithType from './ExtractPropsWithType';
import MakePropsRequired from './MakePropsRequired';

/**
 * Extract the propeties from the resolvers config for configuring scalars
 * and mark them as required.
 */
type ScalarTypes<IResolvers> = MakePropsRequired<ExtractPropsWithType<IResolvers, GraphQLScalarType>>;
export default ScalarTypes;
