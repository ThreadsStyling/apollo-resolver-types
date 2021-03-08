/**
 * Used to unwrap promises to get what the awaited value type will be
 */
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

export default ThenArg;
