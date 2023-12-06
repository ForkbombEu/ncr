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
import { PublicDirectory } from './publicDirectory.js';
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

const L = config.logger;
const Dir = Directory.getInstance();

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
		});

	generateRoutes(app);

	app.get('/*', (res, req) => {
		let file = path.join('public', req.getUrl());
		if (fs.existsSync(file)) {
			const contentType = mime.getType(file) || 'application/octet-stream';
			res.writeHeader('Content-Type', contentType);
			res.end(fs.readFileSync(file));
		} else {
			res.writeStatus('404 Not Found').end('Not found');
		}
	});

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

		app.post(path, (res, req) => {
			res.cork(() => {
				try {
					res
						.onData(async (d) => {
							try {
								const data = handleArrayBuffer(d);
								validateData(schema, data);
								const { result, logs } = await s.execute(contract, { keys, data, conf });
								res
									.writeStatus('200 OK')
									.writeHeader('Content-Type', 'application/json')
									.end(JSON.stringify(result));
							} catch (e) {
								L.error(e);
								res
									.writeStatus('500')
									.writeHeader('Content-Type', 'application/json')
									.end(e.message);
							}
						})
						.onAborted(() => {
							res.writeStatus('500').writeHeader('Content-Type', 'application/json').end(logs);
						});
				} catch (e) {
					L.error(e);
					res.writeStatus('500').writeHeader('Content-Type', 'application/json').end(e.message);
				}
			});
		});

		app.get(path, async (res, req) => {
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
				res
					.writeStatus('200 OK')
					.writeHeader('Content-Type', 'application/json')
					.end(JSON.stringify(result));
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
				endpoint: `http://localhost:${config.port}${path}`
			});

			res.writeStatus('200 OK').writeHeader('Content-Type', 'text/html').end(result);
		});

		L.info(`📜 ${path}`);
	});
};
