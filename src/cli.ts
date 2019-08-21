#!/usr/bin/env node

import {spawn} from 'child_process';
import {resolve, basename, dirname} from 'path';
import {readFileSync} from 'fs';
import {safeLoad} from 'js-yaml';
import {sync as mkdirp} from 'mkdirp';
import ms from 'ms';

const start = Date.now();

const args = process.argv.slice(3);
const watch = args.includes('-w') || args.includes('--watch');
const silent = args.includes('-s') || args.includes('--silent');
const help = args.includes('-h') || args.includes('--help');
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
  console.info('  -w, --watch          Watch for changes and execute generation automatically');
  console.info('');
}
