import Resolver from './Resolver';
import ThenArg from './ThenArg';

// Checks if T can be nullable
type CheckNullable<T> = T extends NonNullable<T> ? true : false;
// If T can be nullable, we say it can also be undefined
type NullableIncludesUndefined<T> = CheckNullable<T> extends true ? T : T | undefined;

/**
 * The type that the schema says is returned by a given resolver
 */

type ResolverRequiredValueType<T> = T extends Resolver<infer S, any> ? NullableIncludesUndefined<ThenArg<S>> : never;
export default ResolverRequiredValueType;
