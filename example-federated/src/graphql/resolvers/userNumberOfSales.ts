import ResolverTypes from '../ResolverTypes';
import {SALES} from '../data';

const userNumberOfSales: ResolverTypes['User']['numberOfSales'] = async (user) => {
  return SALES.filter((s) => s.sellerId === user.id).length;
};
export default userNumberOfSales;
