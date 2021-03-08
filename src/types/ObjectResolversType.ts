import MakePropsRequired from './MakePropsRequired';
import RequiredResolvers from './RequiredResolvers';
import OptionalResolvers from './OptionalResolvers';

/**
 * For a given Type, make resolvers required wherever there is a type mis-match/missing property
 * between GraphQL and TypeScript
 */
type ObjectResolversType<T, TopKey> = MakePropsRequired<Pick<T, RequiredResolvers<T, TopKey>>> &
  Pick<T, OptionalResolvers<T, TopKey>>;
export default ObjectResolversType;
