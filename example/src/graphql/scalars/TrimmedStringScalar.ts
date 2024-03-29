import {Kind, GraphQLScalarType} from 'graphql';

export default new GraphQLScalarType({
  name: 'TrimmedString',

  description: 'A string that will be trimmed when resolved',

  serialize(value): string | null | undefined {
    return value ? (<string>value).trim() : (value as string | null | undefined);
  },

  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.INT:
        return ast.value.toString().trim();
      default:
        return null;
    }
  },

  parseValue(value): string | null | undefined {
    return typeof value === 'string' ? (<string>value).trim() : (value as string | null | undefined);
  },
});
