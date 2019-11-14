import {readFileSync} from 'fs';
import {relative} from 'path';
import {GraphQLError} from 'graphql/error';
import {parse, DocumentNode} from 'graphql/language';
import {validateSDL} from 'graphql/validation/validate';
import {codeFrameColumns} from '@babel/code-frame';
import ExpectedError from './ExpectedError';
import chalk from 'chalk';

const federationSpec = `scalar _FieldSet
directive @external on FIELD_DEFINITION
directive @requires(fields: _FieldSet!) on FIELD_DEFINITION
directive @provides(fields: _FieldSet!) on FIELD_DEFINITION
directive @key(fields: _FieldSet!) on OBJECT | INTERFACE
`;
export default function validateSchema(filename: string, isFederated: boolean): {source: string} {
  let schemaString: string;
  try {
    schemaString = readFileSync(filename, 'utf8');
  } catch (ex) {
    if (ex.code === 'ENOENT') {
      throw new ExpectedError(
        `${chalk.red(`Could not find the schema at`)} ${chalk.cyan(relative(process.cwd(), filename))}`,
      );
    }
    throw ex;
  }

  let parsedSchema: DocumentNode;
  try {
    parsedSchema = parse(isFederated ? federationSpec + schemaString : schemaString);
  } catch (ex) {
    throw new ExpectedError(
      `${chalk.red(`GraphQL syntax error in`)} ${chalk.cyan(relative(process.cwd(), filename))}${chalk.red(`:`)}\n\n` +
        formatError(ex, schemaString, isFederated),
    );
  }

  if (isFederated) {
    // If we are looking at a federated schema, we may be extending
    // nodes that are declared in other schemas. We convert these
    // into ObjectTypeDefinitions before validation
    parsedSchema.definitions.forEach((d) => {
      if (
        d.kind === 'ObjectTypeExtension' &&
        !parsedSchema.definitions.some((d2) => d2.kind === 'ObjectTypeDefinition' && d2.name === d.name)
      ) {
        (d as any).kind = 'ObjectTypeDefinition';
      }
    });
  }

  const errors = validateSDL(parsedSchema);
  if (errors.length) {
    throw new ExpectedError(
      `${chalk.red(`GraphQL schema ${errors.length > 1 ? 'errors' : 'error'} in`)} ${chalk.cyan(
        relative(process.cwd(), filename),
      )}${chalk.red(`:`)}\n\n` + errors.map((e) => formatError(e, schemaString, isFederated)).join('\n'),
    );
  }

  return {source: schemaString};
}

function formatError(
  e: GraphQLError | {message: string; locations: undefined},
  schemaString: string,
  isFederated: boolean,
) {
  if (e.locations && e.locations.length === 1) {
    const [loc] = e.locations;
    return (
      e.message +
      '\n\n' +
      codeFrameColumns(schemaString, {
        start: {line: loc.line - (isFederated ? federationSpec.split('\n').length - 1 : 0), column: loc.column},
      }) +
      '\n'
    );
  } else {
    return e.message;
  }
}
