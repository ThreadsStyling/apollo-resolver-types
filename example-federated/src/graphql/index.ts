import Koa = require('koa');
import {ApolloServer} from 'apollo-server-koa';
import compress = require('koa-compress');
import {buildFederatedSchema} from '@apollo/federation';

import typeDefs from './__generated__/schema';
import ResolverTypes from './ResolverTypes';

import sales from './resolvers/sales';
import saleResolveReference from './resolvers/saleResolveReference';
import saleSeller from './resolvers/saleSeller';
import userSales from './resolvers/userSales';
import userNumberOfSales from './resolvers/userNumberOfSales';

import ResolverContext from './ResolverContext';

export const resolvers: ResolverTypes = {
  Query: {
    sales,
  },
  Sale: {
    // resolve reference is needed to resolve sales referenced by other
    // graphql schemas, as they may only have IDs
    __resolveReference: saleResolveReference,
    seller: saleSeller,
  },
  User: {
    // even if the user comes from another GraphQL schema, we only care
    // about the id, so we don't need a __resolveReference
    sales: userSales,
    numberOfSales: userNumberOfSales,
  },
};

const server = new ApolloServer({
  schema: buildFederatedSchema({
    typeDefs,
    resolvers,
  } as any),
  context: ({ctx}: any) => new ResolverContext(ctx),
  playground: {
    endpoint: '/graphql',
  },
});

const graphql = new Koa();

graphql.use(compress());

server.applyMiddleware({
  app: graphql,
  path: '/',
});

export default graphql;
