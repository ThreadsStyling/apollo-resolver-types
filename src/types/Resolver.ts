/**
 * The type of a resolver for a field. Used to infer the field type
 */
type Resolver<Result, Parent> = (parent: Parent, args: any, context: any, info: any) => Promise<Result> | Result;
export default Resolver;
