#!/usr/bin/env node

import {spawn} from 'child_process';
import {resolve, basename, dirname, relative} from 'path';
import {readFileSync, writeFileSync} from 'fs';
import {safeLoad} from 'js-yaml';
import {sync as mkdirp} from 'mkdirp';
import ms from 'ms';
import sane from 'sane';
import chalk from 'chalk';
import validateSchema from './validateSchema';
import ExpectedError from './ExpectedError';

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

if (watch) {
  const configWatcher = sane(dirname(configFileName), {glob: basename(configFileName)});
  let stopSchemaWatcher = () => Promise.resolve();
  const onConfig = async () => {
    await stopSchemaWatcher();
    stopSchemaWatcher = startSchemaWatcher();
  };
  configWatcher
    .on('ready', onConfig)
    .on('add', onConfig)
    .on('change', onConfig)
    .on('delete', onConfig);
} else {
  (async () => {
    const start = Date.now();
    const config = loadConfig();
    const schemaFileName = resolve(dirname(configFileName), config.schema);
    await generate(config, schemaFileName, start);
  })().catch((ex) => {
    if (ex.code === 'ExpectedError') {
      console.error(ex.message);
    } else {
      console.error(ex.stack);
    }
    process.exit(1);
  });
}

function startSchemaWatcher() {
  let config: any;
  try {
    config = loadConfig();
  } catch (ex) {
    if (ex.code === 'ExpectedError') {
      console.error(ex.message);
    } else {
      console.error(ex.stack);
    }
    console.error('Waiting for GraphQL config changes');
    return () => Promise.resolve();
  }
  let running = false;
  let queued = false;
  let currentGeneratePromise = Promise.resolve();
  const schemaFileName = resolve(dirname(configFileName), config.schema);
  const schemaWatcher = sane(dirname(schemaFileName), {glob: basename(schemaFileName)});
  const onConfig = async () => {
    if (running) {
      queued = true;
      return;
    }
    try {
      try {
        running = true;
        queued = false;
        await (currentGeneratePromise = generate(config, schemaFileName, Date.now()));
      } finally {
        running = false;
      }
    } catch (ex) {
      if (ex.code === 'ExpectedError') {
        console.error(ex.message);
      } else {
        console.error(ex.stack);
      }
    }
    console.error('Waiting for GraphQL schema changes');
    // tslint:disable-next-line:no-floating-promises
    if (queued) onConfig();
  };
  schemaWatcher
    .on('ready', onConfig)
    .on('add', onConfig)
    .on('change', onConfig)
    .on('delete', onConfig);
  return async () => {
    schemaWatcher.close();
    await currentGeneratePromise;
  };
}

function loadConfig() {
  let configSrc: string | null = null;

  try {
    configSrc = readFileSync(configFileName, 'utf8');
  } catch (ex) {
    throw new ExpectedError(
      chalk.red('Could not find config at ') + chalk.cyan(relative(process.cwd(), configFileName)),
    );
  }

  const config = safeLoad(configSrc, {filename: configFileName});
  if (typeof config.schema !== 'string') {
    throw new ExpectedError(chalk.red('Expected config.schema to be a filename'));
  }
  return config;
}

async function generate(config: any, schemaFileName: string, start: number) {
  const {source: schemaString} = validateSchema(
    schemaFileName,
    (config.generates &&
      Object.keys(config.generates).some(
        (key) => config.generates[key].config && config.generates[key].config.federation,
      )) ||
      false,
  );

  if (config.generates) {
    Object.keys(config.generates).forEach((filename) => {
      const dir = dirname(resolve(dirname(configFileName), filename));
      mkdirp(dir);
    });
  }

  const gqlArgs = ['--config', basename(configFileName)];

  if (silent) gqlArgs.push('--silent');

  const code = await new Promise<number>((resolvePromise, rejectPromise) => {
    spawn(require.resolve('.bin/graphql-codegen'), gqlArgs, {
      stdio: 'inherit',
      cwd: dirname(configFileName),
    })
      .on('error', rejectPromise)
      .on('exit', resolvePromise);
  });
  if (code) {
    throw new ExpectedError(chalk.red(`Unable to generate schema`));
  } else {
    if (schemaOutput) {
      writeFileSync(
        schemaOutput,
        `/* tslint:disable */
// This file was automatically generated and should not be edited.
import {gql} from 'apollo-server-koa';
export default gql\`
${schemaString}
\`;
`,
      );
    }

    const end = Date.now();
    if (!silent) {
      console.info(`🚀 Generated GraphQL schema in ${ms(end - start)}`);
    }
  }
}

function usage() {
  console.info('Usage: apollo-resolver-types codegen-config.yml [options]');
  console.info('');
  console.info('Options:');
  console.info('  -w, --watch                Watch for changes and execute generation automatically');
  console.info('  -s, --silent               Do not log progress to the concole');
  console.info('  -o, --schema-output <path> Output schema wrapped in gql tags');
  console.info('');
}
