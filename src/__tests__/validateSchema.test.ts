import ExpectedError from '../ExpectedError';
import validateSchema from '../validateSchema';
import stripAnsi from 'strip-ansi';
function expectError(filename: string, isFederated: boolean) {
  try {
    validateSchema(filename, isFederated);
  } catch (ex) {
    if ((ex as ExpectedError).code !== 'ExpectedError') {
      throw ex;
    }
    return expect(stripAnsi((ex as ExpectedError).message));
  }
  throw new Error('Expected validateSchema to throw');
}

function expectSuccess(filename: string, isFederated: boolean) {
  validateSchema(filename, isFederated);
  return expect(true);
}

test('non-existant.graphql', () => {
  expectError(__dirname + '/non-existant.graphql', false).toMatchInlineSnapshot(
    `"Could not find the schema at src/__tests__/non-existant.graphql"`,
  );
});

test('invalid-schema.graphql', () => {
  expectError(__dirname + '/invalid-schema.graphql', false).toMatchInlineSnapshot(`
    "GraphQL schema errors in src/__tests__/invalid-schema.graphql:

    Unknown type \\"Trimmed\\".

      25 | 
      26 | input ContactInput {
    > 27 |   name: Trimmed!
         |         ^
      28 |   accounts: [AccountInput!]!
      29 |   google: GooglePerson!
      30 | }

    Unknown type \\"Cont\\". Did you mean \\"Int\\"?

      40 | 
      41 | type Mutation {
    > 42 |   createContact(contact: ContactInput!): Cont
         |                                          ^
      43 | }
      44 | 
    "
  `);
});

test('invalid-schema-2.graphql', () => {
  expectError(__dirname + '/invalid-schema-2.graphql', false).toMatchInlineSnapshot(`
    "GraphQL syntax error in src/__tests__/invalid-schema-2.graphql:

    Syntax Error: Unexpected Name \\"typ\\".

      13 | }
      14 | 
    > 15 | typ Contact {
         | ^
      16 |   name: TrimmedString!
      17 |   accounts: [Account!]!
      18 |   google: GooglePerson!
    "
  `);
});

test('invalid-federated-schema.graphql', () => {
  expectError(__dirname + '/invalid-federated-schema.graphql', true).toMatchInlineSnapshot(`
    "GraphQL schema error in src/__tests__/invalid-federated-schema.graphql:

    Unknown type \\"Integer\\".

       8 |   id: ID! @external
       9 |   sales: [Sale]
    > 10 |   numberOfSales: Integer
         |                  ^
      11 | }
      12 | 
      13 | extend type Query {
    "
  `);
});

test('invalid-federated-schema-2.graphql', () => {
  expectError(__dirname + '/invalid-federated-schema-2.graphql', true).toMatchInlineSnapshot(`
    "The field \\"id\\" is missing in User. You can mark it as @external if it comes from another schema, but you must include it to use it in @keys.

       5 | }
       6 | 
    >  7 | extend type User @key(fields: \\"id\\") {
         |                               ^^^^
       8 |   sales: [Sale]
       9 |   numberOfSales: Int
      10 | }
    "
  `);
});

test('valid-federated-with-multiple-primary-keys.graphql', () => {
  expectSuccess(__dirname + '/valid-federated-with-multiple-primary-keys.graphql', true).toBeTruthy();
});

test('valid-federated-with-composite-keys.graphql', () => {
  expectSuccess(__dirname + '/valid-federated-with-composite-keys.graphql', true).toBeTruthy();
});

test('valid-federated-with-composite-keys-deep.graphql', () => {
  expectSuccess(__dirname + '/valid-federated-with-composite-keys-deep.graphql', true).toBeTruthy();
});
