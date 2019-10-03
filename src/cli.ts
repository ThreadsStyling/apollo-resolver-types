#!/usr/bin/env node

import {spawn} from 'child_process';
import {resolve, basename, dirname} from 'path';
import {readFileSync, writeFileSync} from 'fs';
import {safeLoad} from 'js-yaml';
import {sync as mkdirp} from 'mkdirp';
import ms from 'ms';

const start = Date.now();

const args = process.argv.slice(3);
const watch = args.includes('-w') || args.includes('--watch');
const silent = args.includes('-s') || args.includes('--silent');
const help = args.includes('-h') || args.includes('--help');
const schemaIndex = Math.max(args.indexOf('-o'), args.indexOf('--schema-output'));
const schemaOutput = schemaIndex === -1 ? undefined : args[schemaIndex + 1];
let configFileName = process.argv[2];

if (help) {
  usage();
  process.exit(0);
}

if (!configFileName) {
  usage();
  console.error('Missing config');
  process.exit(1);
}

configFileName = resolve(configFileName);

let configSrc: string | null = null;

try {
  configSrc = readFileSync(configFileName, 'utf8');
} catch (ex) {
  usage();
  console.error('Could not find config at ' + configFileName);
  process.exit(1);
}

const config = safeLoad(configSrc!, {filename: configFileName});

if (config.generates) {
  Object.keys(config.generates).forEach((filename) => {
    const dir = dirname(resolve(dirname(configFileName), filename));
    mkdirp(dir);
  });
}

const gqlArgs = ['--config', basename(configFileName)];

if (watch) gqlArgs.push('--watch');
if (silent) gqlArgs.push('--silent');

spawn(require.resolve('.bin/graphql-codegen'), gqlArgs, {
  stdio: 'inherit',
  cwd: dirname(configFileName),
}).on('exit', (code) => {
  if (code) {
    process.exit(code);
  } else {
    // workaround for https://github.com/dotansimha/graphql-code-generator/issues/2676
    if (config.generates) {
      Object.keys(config.generates).forEach((filename) => {
        const original = readFileSync(resolve(dirname(configFileName), filename), 'utf8');
        let src = original;
        if (/\bReferenceResolver\b/.test(src) && !/\btype ReferenceResolver\b/.test(src)) {
          src = `export type ReferenceResolver<TResult, TReference, TContext> = ( 
  reference: TReference, 
  context: TContext, 
  info: GraphQLResolveInfo 
) => Promise<TResult> | TResult;
${src}
`;
        }
        if (src !== original) {
          writeFileSync(resolve(dirname(configFileName), filename), src);
        }
      });
    }

    if (schemaOutput) {
      writeFileSync(
        schemaOutput,
        `/* tslint:disable */
// This file was automatically generated and should not be edited.
import {gql} from 'apollo-server-koa';
export default gql\`
${readFileSync(resolve(dirname(configFileName), config.schema), 'utf8')}
\`;
`,
      );
    }

    const end = Date.now();
    if (!silent) {
      console.info(`🚀 Generated GraphQL schema in ${ms(end - start)}`);
    }
  }
});

function usage() {
  console.info('Usage: apollo-resolver-types codegen-config.yml [options]');
  console.info('');
  console.info('Options:');
  console.info('  -w, --watch                Watch for changes and execute generation automatically');
  console.info('  -s, --silent               Do not log progress to the concole');
  console.info('  -o, --schema-output <path> Output schema wrapped in gql tags');
  console.info('');
}
