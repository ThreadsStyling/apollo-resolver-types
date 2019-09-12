import ResolverTypes from '../ResolverTypes';
import {SALES} from '../data';

const saleResolveReference: ResolverTypes['Sale']['__resolveReference'] = async (parent) => {
  return SALES.find((s) => s.id === parent.id) || null;
};
export default saleResolveReference;
