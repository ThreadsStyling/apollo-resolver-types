import ApolloResolverTypes from '../../../'; // in a real project this is `from '@threads/apollo-resolver-types';`
import * as GeneratedTypes from './__generated__/types';

type ResolverTypes = ApolloResolverTypes<GeneratedTypes.IResolvers>;

export default ResolverTypes;

// To debug why a resolver is "required", uncomment the following
// two lines and hover over the X:

// import {DebugResolver} from '../../../';
// export type X = DebugResolver<ResolverTypes['PartialReturnValue'], 'notRequiredValue'>;
