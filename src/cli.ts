// SPDX-FileCopyrightText: 2024 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Command, Option } from 'commander';
import 'dotenv/config';
import { statSync } from 'node:fs';
import { Logger, type ILogObj } from 'tslog';
import p from '../package.json' with { type: 'json' };
import { Config } from './types';
export const program = new Command();
const L: Logger<ILogObj> = new Logger({
	name: p.name,
	type: 'pretty',
	prettyLogTemplate:
		'{{logLevelName}}  {{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}\t[{{filePathWithLine}}]\t'
});

const bads = ['⛔', '💩', '🥶', '💣'];
const bad = bads[Math.floor(Math.random() * bads.length)];

const data = {
	name: p.name,
	description: p.description,
	version: p.version
};

program
	.name(data.name)
	.description(data.description)
	.addOption(
		new Option('-z, --zencode-directory <directory>', 'specify the zencode contracts directory')
			.env('ZENCODE_DIR')
			.default('./', 'current directory')
			.argParser((d) => {
				try {
					if (statSync(d).isDirectory()) return d;
				} catch {
					L.error(`${bad} ${d} is not a valid directory`);
					process.exit(0);
				}
			})
	)
	.addOption(
		new Option('--public-directory <directory>', 'specify the static files directory')
			.env('PUBLIC_DIR')
			.argParser((d) => {
				try {
					if (statSync(d).isDirectory()) return d;
				} catch {
					L.error(`${bad} ${d} is not a valid directory`);
					process.exit(0);
				}
			})
	)
	.addOption(
		new Option(
			'-p, --port <number>',
			'specify port number; if unspecified ncr will listen to a random free port'
		)
			.env('PORT')
			.default(0)
			.argParser((c) => parseInt(c))
	)
	.addOption(
		new Option(
			'--zenroom-version <string>',
			'specify the version of ZENROOM to interpret the contracts'
		)
			.env('ZENROOM_VERSION')
			.default('4.12.0')
	)
	.addOption(
		new Option('--openapi-path <string>', 'specify where to mount the swagger docs')
			.env('OPENAPI_PATH')
			.default('/docs')
	)
	.addOption(
		new Option('--openapi-info <file>', 'Provide the json info for the swagger docs')
			.env('OPENAPI_INFO')
			.default('./openapi_info.json')
	)
	.addOption(
		new Option('--hostname <string>', 'specify the hostname to serve the server')
			.env('HOSTNAME')
			.default('0.0.0.0')
			.argParser((h) => {
				if (h.includes('/')) {
					L.error(
						`${bad} ${h} is not a valid hostname, subpath should be specified using --basepath option`
					);
					process.exit(0);
				}
				return h;
			})
	)
	.addOption(
		new Option('--template <file>', 'Provide the html template for the applets').default(
			'./applet_template.html'
		)
	)
	.addOption(new Option('-D, --debug', 'debug').env('DEBUG').default(false).argParser(Boolean))
	.addOption(
		new Option('--basepath <string>', 'specify the basepath for all APIs')
			.env('BASEPATH')
			.default('')
			.argParser((b) => {
				if (b === '') return b;
				if (!b.startsWith('/')) {
					L.error(`${bad} ${b} is not a valid subpath, should start with a '/'`);
					process.exit(0);
				}
				if (b.endsWith('/')) {
					L.error(`${bad} ${b} is not a valid subpath, should not end with a '/'`);
					process.exit(0);
				}
				return b;
			})
	)
	.addOption(
		new Option('--dev', 'Activate developer mode')
			.default(false)
	)
	.addOption(
		new Option('--dev-path <string>', 'specify where to mount the developer page')
			.env('DEV_PATH')
			.default('/dev')
	)
	.version(data.version, '-v, --version')
	.addHelpText(
		'after',
		`
Examples:
  # Serve zencode files on the current directory over a random port
  $ ncr

  # Serve all zencode files on ./contracts over 3000 port
  $ ncr -z contracts -p 3000`
	)
	.parse();

export const config: Config = {
	...program.opts(),
	logger: L
};
