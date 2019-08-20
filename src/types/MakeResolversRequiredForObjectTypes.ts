import ObjectResolversType from './ObjectResolversType';
import KeyOf from './KeyOf';

/**
 * Takes an object that looks like:
 *
 *    interface Resolvers {
 *      Query?: {thing?: ThingResolver}
 *      Thing?: {id?: IDResolver, data?: DataResolver}
 *      Data?: {id?: IDResolver, value?: ValueResolver}
 *    }
 *
 * And makes all fields that need resolvers have required resolvers
 */
type MakeResolversRequiredForObjectTypes<IResolvers> = {
  [Key in string & KeyOf<IResolvers>]: ObjectResolversType<Exclude<IResolvers[Key], undefined>>;
};

export default MakeResolversRequiredForObjectTypes;
