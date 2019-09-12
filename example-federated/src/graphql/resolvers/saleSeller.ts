import ResolverTypes from '../ResolverTypes';

const saleSeller: ResolverTypes['Sale']['seller'] = async (parent) => {
  // This is all the detail needed for the Users API to resolve
  // the full user info
  return {id: parent.sellerId};
};
export default saleSeller;
