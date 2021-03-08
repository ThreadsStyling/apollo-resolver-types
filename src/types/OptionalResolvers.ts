import RequiredResolvers from './RequiredResolvers';
import KeyOf from './KeyOf';

/**
 * Inverse of RequiredResolvers
 */
type OptionalResolvers<T, TopKey> = Exclude<KeyOf<T>, RequiredResolvers<T, TopKey>>;

export default OptionalResolvers;
