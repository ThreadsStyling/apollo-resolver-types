import ResolverTypes from '../ResolverTypes';
import {SALES} from '../data';

const sales: ResolverTypes['Query']['sales'] = async () => {
  return SALES;
};
export default sales;
