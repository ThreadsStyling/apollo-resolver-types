import IsGraphAssignable from './IsGraphAssignable';
import ResolverImplicitPropType from './ResolverImplicitPropType';
import ResolverRequiredValueType from './ResolverRequiredValueType';
import KeyOf from './KeyOf';

/**
 * Extract the resolvers that are required for a given GraphQL Type.
 * That is, resolvers for properties that are not defined on the Parent
 * type or that have a different type on the parent to the GraphQL schema.
 */
type RequiredResolvers<T> = Exclude<
  {
    [Key in KeyOf<T>]: IsGraphAssignable<
      ResolverImplicitPropType<T[Key], Key>,
      ResolverRequiredValueType<T[Key]>
    > extends true
      ? never // implicitValue is assignable to expectedValue
      : Key;
  }[KeyOf<T>],
  undefined
>;

export default RequiredResolvers;
