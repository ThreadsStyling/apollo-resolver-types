#!/usr/bin/env node

import {spawn} from 'child_process';
import {resolve, basename, dirname, relative} from 'path';
import {readFileSync, writeFileSync} from 'fs';
import {parse, startChain, param, valid} from 'parameter-reducers';
import {safeLoad, YAMLException} from 'js-yaml';
import {sync as mkdirp} from 'mkdirp';
import ms from 'ms';
import sane from 'sane';
import chalk from 'chalk';
import validateSchema from './validateSchema';
import ExpectedError from './ExpectedError';
import {codeFrameColumns} from '@babel/code-frame';

function requiredParameter(message: string) {
  usage();
  console.error(`🚨 ${message}`);
  return process.exit(1);
}
const params = startChain()
  .addParam(param.flag(['-w', '--watch'], 'watch'))
  .addParam(param.flag(['-s', '--silent'], 'silent'))
  .addParam(param.flag(['-h', '--help'], 'help'))
  .addParam(param.string(['-o', '--schema-output'], 'schemaOutput'))
  .addParam(param.parsedPositionalString('configFileName', (str) => valid(resolve(str))));

const {
  watch = false,
  silent = false,
  help = false,
  schemaOutput,
  configFileName = requiredParameter('Missing config filename'),
} = parse(params, process.argv.slice(2)).extract();

if (help) {
  usage();
  process.exit(0);
}

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
    if ((ex as ExpectedError).code === 'ExpectedError') {
      console.error((ex as ExpectedError).message);
    } else {
      console.error((ex as ExpectedError).stack);
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
      if ((ex as ExpectedError).code === 'ExpectedError') {
        console.error((ex as ExpectedError).message);
      } else {
        console.error((ex as Error).stack);
      }
    }
    console.error('Waiting for GraphQL schema changes');
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
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

  try {
    const config: any = safeLoad(configSrc, {filename: configFileName});
    if (!config || typeof config !== 'object') {
      throw new ExpectedError(
        chalk.red('Expected config in ') + chalk.cyan(relative(process.cwd(), configFileName)) + ' to be an object.',
      );
    }
    if (typeof config.schema !== 'string') {
      throw new ExpectedError(chalk.red('Expected config.schema to be a filename'));
    }
    return config;
  } catch (ex) {
    if (isYamlException(ex)) {
      throw new ExpectedError(
        `${chalk.red(`YAML syntax error in`)} ${chalk.cyan(relative(process.cwd(), configFileName))}${chalk.red(`:`)} ${
          ex.reason
        }\n\n${codeFrameColumns(ex.mark.buffer, {
          start: {line: ex.mark.line, column: ex.mark.column},
        })}\n`,
      );
    } else {
      throw ex;
    }
  }
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
import {gql} from 'graphql-tag';
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

function isYamlException(
  ex: unknown,
): ex is YAMLException & {reason: string; mark: {line: number; column: number; buffer: string}} {
  if (ex instanceof YAMLException) {
    const e: any = ex;
    return (
      typeof e.reason === 'string' &&
      e.mark &&
      typeof e.mark === 'object' &&
      typeof e.mark.line === 'number' &&
      typeof e.mark.column === 'number' &&
      typeof e.mark.line === 'number'
    );
  } else {
    return false;
  }
}
