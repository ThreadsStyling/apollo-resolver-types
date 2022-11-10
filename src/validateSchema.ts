import {readFileSync} from 'fs';
import {relative} from 'path';
import {GraphQLError} from 'graphql/error';
import {parse, DocumentNode, FieldNode} from 'graphql/language';
import {validateSDL} from 'graphql/validation/validate';
import {specifiedSDLRules} from 'graphql/validation/specifiedRules';
import {UniqueDirectivesPerLocationRule} from 'graphql';
import {codeFrameColumns} from '@babel/code-frame';
import ExpectedError from './ExpectedError';
import chalk from 'chalk';
import {gql} from 'apollo-server-koa';

const federationSpec = `scalar _FieldSet
directive @external on FIELD_DEFINITION
directive @requires(fields: _FieldSet!) on FIELD_DEFINITION
directive @provides(fields: _FieldSet!) on FIELD_DEFINITION
directive @key(fields: _FieldSet!) on OBJECT | INTERFACE
`;

const OMITTED_VALIDATION_RULES = [UniqueDirectivesPerLocationRule.name];

const getKeys = (keyValue: string): string[] | null => {
  const keyAsQuery = gql`
  {${keyValue}}
`;

  const {definitions} = keyAsQuery;

  if (definitions.length !== 1) {
    return null;
  }

  const [targetDefinition] = definitions;

  if (targetDefinition.kind !== 'OperationDefinition' || targetDefinition.operation !== 'query') {
    return null;
  }

  return targetDefinition.selectionSet.selections
    .filter((s): s is FieldNode => s.kind === 'Field')
    .map((s) => s.name.value);
};

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
        if (d.name.value !== 'Query' && d.name.value !== 'Mutation') {
          const keyDirective = d.directives?.find(($keyDirective) => $keyDirective.name.value === 'key');
          if (!keyDirective) {
            throw new ExpectedError(
              formatCustomError(
                `To mark ${d.name.value} as "extend", you must add an @key directive.`,
                d.loc,
                schemaString,
                isFederated,
              ),
            );
          }
          const keyArg = keyDirective.arguments?.find(($keyArg) => $keyArg.name.value === 'fields');
          if (!keyArg || keyArg.value.kind !== 'StringValue') {
            throw new ExpectedError(
              formatCustomError(
                `The @key directive should have a "fields" argument of type string`,
                keyDirective.loc,
                schemaString,
                isFederated,
              ),
            );
          }

          const keys = keyArg.value.value.split(',');
          for (const key of keys) {
            const keysToCheck = getKeys(key);

            if (!keysToCheck || !keysToCheck.every((k) => d.fields?.find((field) => field.name.value === k))) {
              throw new ExpectedError(
                formatCustomError(
                  `The field "${key}" is missing in ${d.name.value}. You can mark it as @external if it comes from another schema, but you must include it to use it in @keys.`,
                  keyArg.value.loc,
                  schemaString,
                  isFederated,
                ),
              );
            }
          }
        }
      }
    });
  }

  const rules = specifiedSDLRules.filter((rule) => !OMITTED_VALIDATION_RULES.includes(rule.name));
  const errors = validateSDL(parsedSchema, undefined, rules);
  if (errors.length) {
    throw new ExpectedError(
      `${chalk.red(`GraphQL schema ${errors.length > 1 ? 'errors' : 'error'} in`)} ${chalk.cyan(
        relative(process.cwd(), filename),
      )}${chalk.red(`:`)}\n\n` + errors.map((e) => formatError(e, schemaString, isFederated)).join('\n'),
    );
  }

  return {source: schemaString};
}

function formatCustomError(
  message: string,
  loc: {start: number; end: number} | undefined,
  schemaString: string,
  isFederated: boolean,
) {
  if (loc) {
    const linesStart = schemaString.substr(0, loc.start - (isFederated ? federationSpec.length : 0)).split('\n');
    const linesEnd = schemaString.substr(0, loc.end - (isFederated ? federationSpec.length : 0)).split('\n');

    return (
      message +
      '\n\n' +
      codeFrameColumns(schemaString, {
        start: {
          line: linesStart.length,
          column: linesStart[linesStart.length - 1].length + 1,
        },
        end: {
          line: linesEnd.length,
          column: linesEnd[linesEnd.length - 1].length + 1,
        },
      }) +
      '\n'
    );
  } else {
    return message;
  }
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
