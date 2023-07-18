import Koa = require('koa');
import {ApolloServer} from '@apollo/server';
import compress = require('koa-compress');
import typeDefs from './__generated__/schema';
import ResolverTypes from './ResolverTypes';
import sales from './resolvers/sales';
import saleResolveReference from './resolvers/saleResolveReference';
import saleSeller from './resolvers/saleSeller';
import userSales from './resolvers/userSales';
import userNumberOfSales from './resolvers/userNumberOfSales';
import ResolverContext from './ResolverContext';
import http from 'http';
import {koaMiddleware} from '@as-integrations/koa';
import {ApolloServerPluginDrainHttpServer} from '@apollo/server/plugin/drainHttpServer';
import {buildSubgraphSchema} from '@apollo/subgraph';
import {GraphQLResolverMap} from '@apollo/subgraph/dist/schema-helper';

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

const graphql = new Koa();
const httpServer = http.createServer(graphql.callback());

const server = new ApolloServer({
  schema: buildSubgraphSchema({
    resolvers: resolvers as GraphQLResolverMap<any>,
    typeDefs: typeDefs,
  }),

  plugins: [ApolloServerPluginDrainHttpServer({httpServer})],
});

const init = async () => {
  await server.start();

  graphql.use(compress());

  graphql.use(
    koaMiddleware(server, {
      context: async ({ctx}) => new ResolverContext(ctx),
    }),
  );
};

init().catch(console.error);

export default graphql;
