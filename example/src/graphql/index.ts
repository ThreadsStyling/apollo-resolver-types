import Koa = require('koa');
import {ApolloServer} from '@apollo/server';
import compress = require('koa-compress');
import typeDefs from './__generated__/schema';
import ResolverTypes from './ResolverTypes';
import contacts from './resolvers/contacts';
import contactAccounts from './resolvers/contactAccounts';
import GooglePerson from './scalars/GooglePersonScalar';
import TrimmedString from './scalars/TrimmedStringScalar';
import createContact from './mutations/createContact';
import ResolverContext from './ResolverContext';
import http from 'http';
import {koaMiddleware} from '@as-integrations/koa';
import {ApolloServerPluginDrainHttpServer} from '@apollo/server/plugin/drainHttpServer';

const Mutations: ResolverTypes['Mutation'] = {
  createContact,
};

export const resolvers: ResolverTypes = {
  Query: {
    contacts,
  },
  Contact: {
    accounts: contactAccounts,
  },
  Mutation: Mutations,
  GooglePerson,
  TrimmedString,
};

const graphql = new Koa();
const httpServer = http.createServer(graphql.callback());

const server = new ApolloServer({
  typeDefs,
  resolvers: resolvers,
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
