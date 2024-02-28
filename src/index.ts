import dotenv from 'dotenv';
import fs from 'fs';
import _ from 'lodash';
import mime from 'mime';
import path from 'path';
import { IMeta } from 'tslog';
import {
	App,
	HttpRequest,
	HttpResponse,
	TemplatedApp,
	us_listen_socket,
	us_listen_socket_close,
	us_socket_local_port
} from 'uWebSockets.js';
import { template as proctoroom } from './applets.js';
import { autorunContracts } from './autorun.js';
import { config } from './cli.js';
import { Directory } from './directory.js';
import { reportZenroomError } from './error.js';
import {
	definition,
	generateAppletPath,
	generatePath,
	generateRawPath,
	openapiTemplate
} from './openapi.js';
import { SlangroomManager } from './slangroom.js';
import { getSchema, validateData } from './utils.js';
dotenv.config();

const L = config.logger;
const Dir = Directory.getInstance();

const PROM = process.env.PROM == 'true';

const setupProm = async (app: TemplatedApp) => {
	const client = await import('prom-client');
	const register = new client.Registry();
	register.setDefaultLabels({
		app: 'ncr'
	});
	client.collectDefaultMetrics({ register });

	const co2lib = await import('@tgwf/co2');
	const swd = new co2lib.co2({ model: 'swd' });

	const co2_emission = new client.Gauge({
		name: 'co2_emission',
		help: 'Emissions for 1GB',
		collect() {
			const emissions = swd.perByte(1000000000);
			this.set(emissions);
		}
	});

	register.registerMetric(co2_emission);

	app.get('/metrics', (res, req) => {
		register
			.metrics()
			.then((metrics) =>
				res.writeStatus('200 OK').writeHeader('Content-Type', register.contentType).end(metrics)
			);
	});
};

const ncrApp = async () => {
	const app = App()
		.get('/', (res, req) => {
			const files = Dir.paths.map((f) => `http://${req.getHeader('host')}${f}`);
			res
				.writeStatus('200 OK')
				.writeHeader('Content-Type', 'application/json')
				.end(JSON.stringify(files));
		})
		.get(config.openapiPath, (res, req) => {
			res.writeStatus('200 OK').writeHeader('Content-Type', 'text/html').end(openapiTemplate);
		})
		.get('/oas.json', (res, req) => {
			Dir.files.map(async (endpoints) => {
				const { path } = endpoints;
				if (definition.paths) {
					const schema = await getSchema(endpoints);
					if (schema) definition.paths[path] = generatePath(endpoints.contract, schema);
					definition.paths[path + '/raw'] = generateRawPath();
					definition.paths[path + '/app'] = generateAppletPath();
				}
			});

			res.cork(() => {
				res
					.writeStatus('200 OK')
					.writeHeader('Content-Type', 'application/json')
					.end(JSON.stringify(definition));
			});
		})
		.get('/health', async (res, _) => {
			res.onAborted(() => {
				res.writeStatus('500').writeHeader('Content-Type', 'application/json').end('Aborted');
			});
			const s = SlangroomManager.getInstance();
			const contract = `
Rule unknown ignore
Given I connect to 'hi_endpoint' and do get and output into 'hi_result'
and debug
Given I have a 'string' named 'result' in 'hi result'
Then print the 'result'
`;
			const keys = {
				hi_endpoint: `http://localhost:${config.port}/sayhi`
			};
			try {
				const { result } = await s.execute(contract, { keys });
				res.cork(() => {
					res
						.writeStatus('200 OK')
						.writeHeader('Content-Type', 'application/json')
						.end(JSON.stringify(result));
				});
			} catch (e) {
				L.error(e);
				res.cork(() =>
					res
						.writeStatus('500')
						.writeHeader('Content-Type', 'application/json')
						.end((e as Error).message)
				);
			}
		})
		.get('/sayhi', (res, _) => {
			res.writeStatus('200 OK').writeHeader('Content-Type', 'text/plain').end('Hi');
		});

	if (PROM) {
		await setupProm(app);
	}
	return app;
};

Dir.ready(async () => {
	let listen_socket: us_listen_socket;

	const app = await ncrApp();

	await autorunContracts();

	generateRoutes(app);

	const { publicDirectory } = config;
	if (publicDirectory) {
		app.get('/*', (res, req) => {
			let file = path.join(publicDirectory, req.getUrl());
			if (fs.existsSync(file)) {
				const contentType = mime.getType(file) || 'application/octet-stream';
				res.writeHeader('Content-Type', contentType);
				res.end(fs.readFileSync(file));
			} else {
				res.writeStatus('404 Not Found').end('Not found');
			}
		});
	}

	app.listen(config.port, (socket) => {
		const port = us_socket_local_port(socket);
		listen_socket = socket;
		L.info(`Swagger UI is running on http://${config.hostname}:${port}/docs`);
	});

	Dir.onChange(async () => {
		try {
			const port = us_socket_local_port(listen_socket);
			us_listen_socket_close(listen_socket);
			const app = await ncrApp();
			generateRoutes(app);
			app.listen(port, (socket) => {
				listen_socket = socket;
				L.info(`Swagger UI is running on http://${config.hostname}:${port}/docs`);
			});
		} catch (error) {
			L.error(error);
		}
	});
});

const generateRoutes = (app: TemplatedApp) => {
	Dir.files.forEach(async (endpoints) => {
		const { contract, path, keys, conf, metadata } = endpoints;
		const LOG = L.getSubLogger({
			stylePrettyLogs: true,
			prettyLogTemplate:
				'{{logLevelName}}\t📜 {{zencode}}.zen \t🕙 {{dateIsoStr}} \t📁 {{filePathWithLine}}\t\t',
			overwrite: {
				addPlaceholders: (
					logObjMeta: IMeta,
					placeholderValues: Record<string, string | number>
				) => {
					placeholderValues['zencode'] = path;
				}
			}
		});

		let schema = await getSchema(endpoints);
		if (!schema) {
			L.warn(`🛟 ${path} 🚧 Please provide a valide schema`);
			schema = { type: 'object', properties: {} };
		}

		const s = SlangroomManager.getInstance();

		const execZencodeAndReply = async (
			res: HttpResponse,
			req: HttpRequest,
			data: JSON | Record<string, unknown>
		) => {
			res.onAborted(() => {
				res.aborted = true;
				res.cork(() => res.writeStatus('400').end());
				return;
			});
			try {
				if (metadata.httpHeaders) {
					try {
						if (data['http_headers'] !== undefined) {
							throw new Error('Name clash on input key http_headers');
						}
						const httpHeaders = {};
						req.forEach((k, v) => {
							httpHeaders[k] = v;
						});
						data['http_headers'] = httpHeaders;
					} catch (e) {
						if (!res.aborted) {
							LOG.fatal(e);
							res
								.writeStatus('422 UNPROCESSABLE ENTITY')
								.writeHeader('Content-Type', 'application/json')
								.end((e as Error).message);
						}
						return;
					}
				}

				try {
					validateData(schema, data);
				} catch (e) {
					if (!res.aborted) {
						LOG.fatal(JSON.parse((e as Error).message));
						res.cork(() => {
							res
								.writeStatus('422 UNPROCESSABLE ENTITY')
								.writeHeader('Content-Type', 'application/json')
								.end((e as Error).message);
						});
					}
					return;
				}

				let slangroomResult: string;

				try {
					const { result } = await s.execute(contract, { keys, data, conf });
					slangroomResult = JSON.stringify(result);
				} catch (e) {
					if (!res.aborted) {
						res.cork(() => {
							const report = reportZenroomError(e as Error, LOG, endpoints);
							res.writeStatus('500').writeHeader('Content-Type', 'application/json').end(report);
						});
						return;
					}
				}

				res.cork(() => {
					res
						.writeStatus('200 OK')
						.writeHeader('Content-Type', 'application/json')
						.writeHeader('Access-Control-Allow-Origin', '*')
						.end(slangroomResult);
					return;
				});
			} catch (e) {
				LOG.fatal(e);
				res.cork(() =>
					res
						.writeStatus('500')
						.writeHeader('Content-Type', 'application/json')
						.end((e as Error).message)
				);
				return;
			}
		};
		app.options(path, (res) => {
			res.cork(() => {
				res.onAborted(() => {
					res.writeStatus('500').end('Aborted');
				});

				res.writeHeader('Access-Control-Allow-Origin', '*').writeStatus('200 OK').end();
			});
		});

		app.post(path, (res, req) => {
			/**
			 * Code may break on `slangroom.execute`
			 * so it's important to attach the `onAborted` handler before everything else
			 */
			res.onAborted(() => {
				res.writeStatus('500').writeHeader('Content-Type', 'application/json').end('Aborted');
			});

			let buffer: Buffer;
			res.onData((d, isLast) => {
				let chunk = Buffer.from(d);
				if (isLast) {
					let data;
					try {
						data = JSON.parse(buffer ? Buffer.concat([buffer, chunk]) : chunk);
					} catch (e) {
						L.error(e);
						res
							.writeStatus('500')
							.writeHeader('Content-Type', 'application/json')
							.end((e as Error).message);
						return;
					}
					execZencodeAndReply(res, req, data);
					return;
				} else {
					if (buffer) {
						buffer = Buffer.concat([buffer, chunk]);
					} else {
						buffer = Buffer.concat([chunk]);
					}
				}
			});
		});

		app.get(path, async (res, req) => {
			/**
			 * Code may break on `slangroom.execute`
			 * so it's important to attach the `onAborted` handler before everything else
			 */
			res.onAborted(() => {
				res.writeStatus('500').writeHeader('Content-Type', 'application/json').end('Aborted');
			});

			try {
				const data: Record<string, unknown> = {};
				const q = req.getQuery();
				if (q) {
					q.split('&').map((r) => {
						const [k, v] = r.split('=');
						data[k] = v;
					});
				}
				execZencodeAndReply(res, req, data);
			} catch (e) {
				LOG.fatal(e);
				res
					.writeStatus('500')
					.writeHeader('Content-Type', 'application/json')
					.end((e as Error).message);
			}
		});

		app.get(path + '/raw', (res, req) => {
			res.writeStatus('200 OK').writeHeader('Content-Type', 'text/plain').end(contract);
		});

		app.get(path + '/app', async (res, req) => {
			const result = _.template(proctoroom)({
				contract: contract,
				schema: JSON.stringify(schema),
				title: path || 'Welcome 🥳 to ',
				description: contract,
				endpoint: `http://${config.hostname}:${config.port}${path}`
			});

			res.writeStatus('200 OK').writeHeader('Content-Type', 'text/html').end(result);
		});

		L.info(`📜 ${path}`);
	});
};
