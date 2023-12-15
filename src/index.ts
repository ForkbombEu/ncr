import { config } from './cli.js';
//@ts-ignore
import { Slangroom } from '@slangroom/core';
//@ts-ignore
import { wallet } from '@slangroom/wallet';
//@ts-ignore
import { http } from '@slangroom/http';
import _ from 'lodash';
import {
	App,
	TemplatedApp,
	us_listen_socket,
	us_listen_socket_close,
	us_socket_local_port
} from 'uWebSockets.js';
import { template as proctoroom } from './applets.js';
import { Directory } from './directory.js';
import {
	definition,
	generateAppletPath,
	generatePath,
	generateRawPath,
	openapiTemplate
} from './openapi.js';
import { getSchema, handleArrayBuffer, validateData } from './utils.js';
import mime from 'mime';
import path from 'path';
import fs from 'fs';

import promClient from 'prom-client'

const L = config.logger;
const Dir = Directory.getInstance();

const promRegister = new promClient.Registry()
promRegister.setDefaultLabels({
	app: 'ncr'
})
promClient.collectDefaultMetrics({ register: promRegister })

Dir.ready(async () => {
	let listen_socket: us_listen_socket;

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

			res
				.writeStatus('200 OK')
				.writeHeader('Content-Type', 'application/json')
				.end(JSON.stringify(definition));
		})
		.get('/metrics', (res, req) => {
			promRegister.metrics().then(metrics =>
				res
					.writeStatus('200 OK')
					.writeHeader('Content-Type', promRegister.contentType)
					.end(metrics));
		})
		.get('/health', async (res, _) => {
			res.onAborted(() => {
				res.writeStatus('500').writeHeader('Content-Type', 'application/json').end('Aborted');
			});
			const s = new Slangroom([http, wallet]);
			const contract = `
Rule unknown ignore
Given I connect to 'hi_endpoint' and do get and output into 'hi_result'
and debug
Given I have a 'string' named 'result' in 'hi result'
Then print the 'result'
`
			const keys =
{
    "hi_endpoint": `http://localhost:${config.port}/sayhi`
}
			try {
				const { result } = await s.execute(contract, {keys});
				res.cork(() => {
					res
						.writeStatus('200 OK')
						.writeHeader('Content-Type', 'application/json')
						.end(JSON.stringify(result));
				});
			} catch (e) {
				L.error(e);
				res.cork(() => res.writeStatus('500').writeHeader('Content-Type', 'application/json').end(e.message));
			}
		})
		.get('/sayhi', (res, _) => {
			res
				.writeStatus('200 OK')
				.writeHeader('Content-Type', 'text/plain')
				.end("Hi");
		})

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
			const app = App();
			generateRoutes(app);
			// generatePublicFilesRoutes(app);
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
		const { contract, path, keys, conf } = endpoints;

		const schema = await getSchema(endpoints);
		if (!schema) {
			L.error(`Invalid schema`);
			return;
		}

		const s = new Slangroom([http, wallet]);

		app.options(path, (res) => {
			res.cork(() => {
				res.onAborted(() => {
					res.writeStatus('500').end('Aborted');
				});

				res
					.writeHeader("Access-Control-Allow-Origin", "*")
					.writeStatus('200 OK')
					.end()
			});
		})

		app.post(path, (res, req) => {
			/**
			 * Code may break on `slangroom.execute`
			 * so it's important to attach the `onAborted` handler before everything else
			 */
			res.onAborted(() => {
				res.writeStatus('500').writeHeader('Content-Type', 'application/json').end('Aborted');
			});

			try {
				res.onData(async (d) => {
					try {
						const data = handleArrayBuffer(d);
						validateData(schema, data);

						const { result } = await s.execute(contract, { keys, data, conf });

						res.cork(() => {
							res
								.writeStatus('200 OK')
								.writeHeader('Content-Type', 'application/json')
								.writeHeader("Access-Control-Allow-Origin", "*")
								.end(JSON.stringify(result));
						});
					} catch (e) {
						L.error(e);
						res.writeStatus('500').writeHeader('Content-Type', 'application/json').end(e.message);
					}
				});
			} catch (e) {
				L.error(e);
				res.writeStatus('500').writeHeader('Content-Type', 'application/json').end(e.message);
			}
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
				validateData(schema, data);

				const { result } = await s.execute(contract, { keys, conf, data });

				res.cork(async () => {
					res
						.writeStatus('200 OK')
						.writeHeader('Content-Type', 'application/json')
						.writeHeader("Access-Control-Allow-Origin", "*")
						.end(JSON.stringify(result));
				});
			} catch (e) {
				L.error(e);
				res.writeStatus('500').writeHeader('Content-Type', 'application/json').end(e.message);
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
