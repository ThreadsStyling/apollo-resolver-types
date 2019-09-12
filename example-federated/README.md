# Example GraphQL API

To build:

```
yarn schema && yarn build
```

To run:

```
yarn start
```

You can then run a query like:

```graphql
query foo($entities: [_Any!]!) {
  _service {
    sdl
  }
  _entities(representations: $entities) {
    __typename
    ... on Sale {
      id
      seller {
        id
      }
    }
  }
  sales {
    id
    seller {
      id
    }
  }
}
```

with variables:

```json
{"entities": [{"__typename": "Sale", "id": "s1"}]}
```

in the graphiql editor at `http://localhost:3000/graphql` and get a result that looks like:

```json
{
  "data": {
    "_service": {
      "sdl": "extend type Query {\n  sales: [Sale]\n}\n\ntype Sale @key(fields: \"id\") {\n  id: ID!\n  name: String\n  seller: User\n}\n\nextend type User @key(fields: \"id\") {\n  id: ID! @external\n  sales: [Sale]\n  numberOfSales: Int\n}\n"
    },
    "_entities": [
      {
        "__typename": "Sale",
        "id": "s1",
        "seller": {
          "id": "u1"
        }
      }
    ],
    "sales": [
      {
        "id": "s1",
        "seller": {
          "id": "u1"
        }
      }
    ]
  }
}
```

The `_` prefixed fields are used by apollo's federation server.

Project structure:

- src/graphql/mutations - example mutations. The file names match the name of the mutation.
- src/graphql/resolvers - example resolvers. The file names of resolvers on the root query match the name of the field. File names of resolvers on objects are of the form `objectNameFieldName.ts`
- src/graphql/scalars - example scalar definitions
- src/graphql/codegen.yml - config to tell apollo-resolver-types where to find the various types used on the server side.
- src/graphql/ResolverContext.ts - a class for the resolver context, this would normally include authentication, a logger & potentially some caches that only last for the given request.
- src/graphql/ResolverTypes.ts - this binds the types generated from the schema up with the apollo-resolver-types lib to mark necessary resolvers as required.
- src/graphql/schema.graphql - the graphql schema exposed to clients of this service
- src/graphql/index.ts - the koa/apollo server.
