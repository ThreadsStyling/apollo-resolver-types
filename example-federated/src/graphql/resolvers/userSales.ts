import ResolverTypes from '../ResolverTypes';
import {SALES} from '../data';

const userSales: ResolverTypes['User']['sales'] = async (user) => {
  return SALES.filter((s) => s.sellerId === user.id);
};
export default userSales;
