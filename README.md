# apollo-resolver-types

Strong typing for apollo resolvers

## Usage

To setup a graphql server with strong types you will need the following:

- [src/graphql/schema.graphql](example/src/graphql/schema.graphql) - The GraphQL schema defining the types & fields visible to the client
- [src/graphql/codegen.yml](example/src/graphql/codegen.yml) - a config file for the code generator. This should generate two outputs. The first is the type definitions for TypeScript, the second is the schema prepared for apollo to consume it. This file defines:
  - where to get the ResolverContext type
  - what type is used for any custom scalars (within the server, they may have a different type on the client side).
  - where any enums are defined - you should make sure that the values of your TypeScript enums match the values they have in the GraphQL schema
  - the type "mappings" for the server side type of each object - this is the type that you will fetch when asked for this object in a resolver. If the type of fields on the object match those you expose, you will not need to add a resolver.
- [src/graphql/ResolverContext.ts](example/src/graphql/ResolverContext.ts) - It's generally best to define a class for the ResolverContext, so you can extend it with any additional properties you want later. This is where you would add the logger, authenticated user, etc.
- [src/graphql/ResolverTypes.ts](example/src/graphql/ResolverTypes.ts) - here you combine the generated types with `ApolloResolverTypes` to mark any necessary resolvers as required.
- [src/graphql/index.ts](example/src/graphql/index.ts) - The koa apollo server. This is where you combine all your resolvers together. Note that using koa-compress is essential for good performance in GraphQL (without gzip, gql is a very inefficient format).

> Since the type definitions for GraphQL can get pretty big, you might find TypeScript runs out of memory. This can usually be solved by replacing your `tsc` call with `NODE_OPTIONS=\"--max-old-space-size=2048\" tsc`.

`./src/graphql/ResolverTypes.ts` should look like:

```ts
import ApolloResolverTypes from '@threads/apollo-resolver-types';
import * as GeneratedTypes from './__generated__/types';

type ResolverTypes = ApolloResolverTypes<GeneratedTypes.IResolvers>;
export default ResolverTypes;
```

You can then refer to `ResolverTypes['Query']['contactById']` to get the type of the `contactById` resolver or `ResolverTypes['Contact']['accounts']` to get the `accounts` resolver on the `Contact` object.

### CLI Usage

To generate the types from your schema, run: `apollo-resolver-types src/graphql/codegen.yml`. If you've configured it as per the example, this will output two files in the `src/graphql/__generated__` directory. For a full list of available config options, see https://graphql-code-generator.com/

```
apollo-resolver-types codegen-config.yml [options]

Options:
  -w, --watch          Watch for changes and execute generation automatically
```

## Debugging

Sometimes you might be unclear on why a given resolver is required. You might think it should be optional, but apollo-resolver-types says it's required. To resolve this you can try:

```ts
import * as GeneratedTypes from './__generated__/types';
import {DebugResolver} from '@threads/apollo-resolver-types';

type X = DebugResolver<GeneratedTypes.IResolvers['Contact'], 'accounts'>;
```

You can then hover over X and you should see something like:

```ts
type X = {
  requiredValue: Account[];
  implicitValue: undefined;
};
```

The requiredValue is the type defined in the GraphQL schema. The implicitValue is the value in TypeScript. If the implicitValue is assignable to the requiredValue, no resolver should be required. In the above example, `undefined` cannot be assigned to `Account[]`, so you will need a resolver for `Contact.accounts`.
