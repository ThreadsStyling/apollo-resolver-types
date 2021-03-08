import ResolverTypes from '../ResolverTypes';

const partialReturnValue: ResolverTypes['Query']['partialReturnValue'] = async () => {
  return {id: 1};
};
export default partialReturnValue;
