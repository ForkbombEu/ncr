import { Command, Option, type OptionValues } from 'commander';
// import figlet from "figlet";
// import gradient from "gradient-string";
import { statSync } from 'node:fs';
import pino, { type Logger } from 'pino';
import 'dotenv/config';
import { Config } from './types';

const program = new Command();
const L = pino();
const bads = ['⛔', '💩', '🥶', '💣'];
const bad = bads[Math.floor(Math.random() * bads.length)];

const data = {
	name: 'NoCodeRoom',
	description:
		"The best tool ever for No code API's directly created from human readable Zencode smart contracts inside a live-folder",
	version: '1.0.0'
};

program
	.name(data.name)
	.description(data.description)
	// .addHelpText(
	//    "beforeAll",
	//    gradient.instagram(figlet.textSync(data.name, { font: "Elite" }))
	// )
	.addOption(
		new Option('-z, --zencode-directory <directory>', 'specify the zencode contracts directory')
			.env('ZENCODE_DIR')
			.default('./', 'current directory')
			.argParser((d) => {
				try {
					if (statSync(d).isDirectory()) return d;
				} catch (e) {
					L.error(`${bad} ${d} is not a valid directory`);
					process.exit(0);
				}
			})
	)
	.addOption(
		new Option(
			'-p, --port <number>',
			'specify port number; if unspecified restroom will listen to a random free port'
		)
			.env('PORT')
			.default(0)
			.argParser(parseInt)
	)
	.addOption(
		new Option(
			'--zenroom-version <string>',
			'specify the version of ZENROOM to interpret the contracts'
		)
			.env('ZENROOM_VERSION')
			.default('4.2.1')
	)
	.addOption(
		new Option('--openapi-path <string>', 'specify where to mount the swagger docs')
			.env('OPENAPI_PATH')
			.default('/docs')
	)
	.addOption(
		new Option('--hostname <string>', 'Provide the hostname to serve the server')
			.env('HOSTNAME')
			.default('0.0.0.0')
	)
	.addOption(
		new Option('--template <file>', 'Provide the html template for the applets').default(
			'./applet_template.html'
		)
	)
	.addOption(new Option('-D, --debug', 'debug').env('DEBUG').default(false).argParser(Boolean))
	.version(data.version, '-v, --version')
	.addHelpText(
		'after',
		`
Examples:
  $ restroom -z contracts -p 3000`
	)
	.parse();

export const config: Config = {
	...program.opts(),
	logger: L
};
