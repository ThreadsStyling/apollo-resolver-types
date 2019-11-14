import validateSchema from '../validateSchema';

function expectError(filename: string, isFederated: boolean) {
  try {
    validateSchema(filename, isFederated);
  } catch (ex) {
    expect(ex.code).toBe('ExpectedError');
    return expect(require('strip-ansi')(ex.message));
  }
  throw new Error('Expected validateSchema to throw');
}

test('non-existant.graphql', () => {
  expectError(__dirname + '/non-existant.graphql', false).toMatchInlineSnapshot(
    `"Could not find the schema at src/__tests__/non-existant.graphql"`,
  );
});

test('invalid-schema.graphql', () => {
  expectError(__dirname + '/invalid-schema.graphql', false).toMatchInlineSnapshot(`
    "GraphQL schema errors in src/__tests__/invalid-schema.graphql:

    Unknown type \\"Trimmed\\". Did you mean \\"TrimmedString\\"?

      25 | 
      26 | input ContactInput {
    > 27 |   name: Trimmed!
         |         ^
      28 |   accounts: [AccountInput!]!
      29 |   google: GooglePerson!
      30 | }

    Unknown type \\"Cont\\". Did you mean \\"Int\\", \\"Contact\\", or \\"Account\\"?

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

    Syntax Error: Unexpected Name \\"typ\\"

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
