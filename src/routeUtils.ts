// SPDX-FileCopyrightText: 2024 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from 'fs';
import _ from 'lodash';
import { HttpRequest, HttpResponse, TemplatedApp } from 'uWebSockets.js';
import { execute as slangroomChainExecute } from '@dyne/slangroom-chain';

import { reportZenroomError } from './error.js';
import { Endpoints, JSONSchema, Logger, ILogObj } from './types.js';
import { config } from './cli.js';
import { SlangroomManager } from './slangroom.js';
import { forbidden, methodNotAllowed, notFound, unprocessableEntity } from './responseUtils.js';
import { getSchema, validateData, getQueryParams } from './utils.js';
import { template as proctoroom } from './applets.js';

//

export class PrefixedApp {
	app: TemplatedApp;
	basePath: string;

	constructor(app: TemplatedApp, basePath: string) {
		this.app = app;
		this.basePath = basePath;
	}

	get(path: string, handler: (res: HttpResponse, req: HttpRequest) => void): PrefixedApp {
		this.app.get(`${this.basePath}${path}`, (res, req) => {
			handler(res, req);
		});
		return this;
	}

	post(path: string, handler: (res: HttpResponse, req: HttpRequest) => void): PrefixedApp {
		this.app.post(`${this.basePath}${path}`, (res, req) => {
			handler(res, req);
		});
		return this;
	}

	put(path: string, handler: (res: HttpResponse, req: HttpRequest) => void): PrefixedApp {
		this.app.put(`${this.basePath}${path}`, (res, req) => {
			handler(res, req);
		});
		return this;
	}

	delete(path: string, handler: (res: HttpResponse, req: HttpRequest) => void): PrefixedApp {
		this.app.delete(`${this.basePath}${path}`, (res, req) => {
			handler(res, req);
		});
		return this;
	}

	patch(path: string, handler: (res: HttpResponse, req: HttpRequest) => void): PrefixedApp {
		this.app.patch(`${this.basePath}${path}`, (res, req) => {
			handler(res, req);
		});
		return this;
	}

	head(path: string, handler: (res: HttpResponse, req: HttpRequest) => void): PrefixedApp {
		this.app.head(`${this.basePath}${path}`, (res, req) => {
			handler(res, req);
		});
		return this;
	}

	options(path: string, handler: (res: HttpResponse, req: HttpRequest) => void): PrefixedApp {
		this.app.options(`${this.basePath}${path}`, (res, req) => {
			handler(res, req);
		});
		return this;
	}

	connect(path: string, handler: (res: HttpResponse, req: HttpRequest) => void): PrefixedApp {
		this.app.connect(`${this.basePath}${path}`, (res, req) => {
			handler(res, req);
		});
		return this;
	}

	trace(path: string, handler: (res: HttpResponse, req: HttpRequest) => void): PrefixedApp {
		this.app.trace(`${this.basePath}${path}`, (res, req) => {
			handler(res, req);
		});
		return this;
	}

	listen(...args: Parameters<TemplatedApp['listen']>): ReturnType<TemplatedApp['listen']> {
		return this.app.listen(...args);
	}
}

//

const L = config.logger;
const emoji = {
	add: '📜',
	update: '📝',
	delete: '🗑️ '
};

const setCorsHeaders = (res: HttpResponse) => {
	res
		.writeHeader('Access-Control-Allow-Origin', '*')
		.writeHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
		.writeHeader('Access-Control-Allow-Headers', 'content-type, authorization');
};

export const runPrecondition = async (preconditionPath: string, data: Record<string, any>) => {
	const s = SlangroomManager.getInstance();
	const zen = fs.readFileSync(preconditionPath + '.slang').toString();
	const keys = fs.existsSync(preconditionPath + '.keys.json')
		? JSON.parse(fs.readFileSync(preconditionPath + '.keys.json'))
		: null;
	await s.execute(zen, { data, keys });
};

const execZencodeAndReply = async (
	res: HttpResponse,
	endpoint: Endpoints,
	data: JSON | Record<string, unknown>,
	headers: Record<string, Record<string, string>>,
	schema: JSONSchema,
	LOG: Logger<ILogObj>
) => {
	res.onAborted(() => {
		res.aborted = true;
		res.cork(() => res.writeStatus('400').end());
		return;
	});
	const { contract, chain, path, keys, conf, metadata } = endpoint;
	try {
		if (metadata.httpHeaders) {
			try {
				if (data['http_headers'] !== undefined) {
					throw new Error('Name clash on input key http_headers');
				}
				data['http_headers'] = headers;
			} catch (e) {
				unprocessableEntity(res, LOG, e as Error);
				return;
			}
		}
		if (metadata.precondition) {
			try {
				await runPrecondition(metadata.precondition, data);
			} catch (e) {
				forbidden(res, LOG, e as Error);
				return;
			}
		}

		try {
			validateData(schema, data);
		} catch (e) {
			unprocessableEntity(res, LOG, e as Error);
			return;
		}

		let jsonResult: Record<string, unknown>;
		try {
			if (chain) {
				const dataFormatted = data ? JSON.stringify(data) : undefined;
				const parsedChain = eval(chain)();
				const res = await slangroomChainExecute(parsedChain, dataFormatted);
				jsonResult = JSON.parse(res);
			} else {
				const s = SlangroomManager.getInstance();
				({ result: jsonResult } = await s.execute(contract, { keys, data, conf }));
			}
		} catch (e) {
			if (!res.aborted) {
				res.cork(() => {
					const report = reportZenroomError(e as Error, LOG, endpoint);
					res
						.writeStatus(metadata.errorCode)
						.writeHeader('Access-Control-Allow-Origin', '*')
						.end(report);
				});
				return;
			}
		}
		if (metadata.httpHeaders) {
			if (jsonResult.http_headers !== undefined && jsonResult.http_headers.response !== undefined) {
				headers.response = jsonResult.http_headers.response;
			}
			delete jsonResult.http_headers;
		}
		const slangroomResult = JSON.stringify(jsonResult);
		res.cork(() => {
			if (metadata.httpHeaders && headers.response !== undefined) {
				for (const [k, v] of Object.entries(headers.response)) {
					res.writeHeader(k, v);
				}
			}
			res
				.writeStatus(metadata.successCode)
				.writeHeader('Content-Type', metadata.successContentType)
				.writeHeader('Access-Control-Allow-Origin', '*')
				.end(slangroomResult);
			return;
		});
	} catch (e) {
		LOG.fatal(e);
		res.cork(() =>
			res
				.writeStatus(metadata.errorCode)
				.writeHeader('Access-Control-Allow-Origin', '*')
				.end((e as Error).message)
		);
		return;
	}
};

const generatePost = (
	app: PrefixedApp,
	endpoint: Endpoints,
	schema: JSONSchema,
	LOG: Logger<ILogObj>,
	action: 'add' | 'update' | 'delete'
) => {
	const { path, metadata } = endpoint;
	app.post(path, (res, req) => {
		if (action === 'delete') {
			notFound(res, LOG, new Error(`Not found on ${path}`));
			return;
		}
		if (metadata.disablePost) {
			methodNotAllowed(res, LOG, new Error(`Post method not allowed on ${path}`));
			return;
		}
		let headers: Record<string, Record<string, string>> = {};
		headers.request = {};
		req.forEach((k, v) => {
			headers.request[k] = v;
		});
		/**
		 * Code may break on `slangroom.execute`
		 * so it's important to attach the `onAborted` handler before everything else
		 */
		res.onAborted(() => {
			res.writeStatus(metadata.errorCode ? metadata.errorCode : '500').end('Aborted');
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
						.writeStatus(metadata.errorCode)
						.writeHeader('Access-Control-Allow-Origin', '*')
						.end((e as Error).message);
					return;
				}
				execZencodeAndReply(res, endpoint, data, headers, schema, LOG);
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
};

const generateGet = (
	app: PrefixedApp,
	endpoint: Record<string, any>,
	schema: JSONSchema,
	LOG: Logger<ILogObj>,
	action: 'add' | 'update' | 'delete'
) => {
	const { path, metadata } = endpoint;
	app.get(path, async (res, req) => {
		if (action === 'delete') {
			notFound(res, LOG, new Error(`Not found on ${path}`));
			return;
		}
		if (metadata.disableGet) {
			methodNotAllowed(res, LOG, new Error(`Get method not allowed on ${path}`));
			return;
		}
		let headers: Record<string, Record<string, string>> = {};
		headers.request = {};
		req.forEach((k, v) => {
			headers.request[k] = v;
		});
		/**
		 * Code may break on `slangroom.execute`
		 * so it's important to attach the `onAborted` handler before everything else
		 */
		res.onAborted(() => {
			res.writeStatus(metadata.errorCode).end('Aborted');
		});

		try {
			const data: Record<string, unknown> = getQueryParams(req);
			execZencodeAndReply(res, endpoint, data, headers, schema, LOG);
		} catch (e) {
			LOG.fatal(e);
			res.writeStatus(metadata.errorCode).end((e as Error).message);
			return;
		}
	});
};

export const generateRoute = async (
	app: PrefixedApp,
	endpoint: Endpoints,
	action: 'add' | 'update' | 'delete'
) => {
	const { contract, path, metadata } = endpoint;
	if (metadata.hidden) return;

	let schema = null;
	if (action !== 'delete') {
		schema = await getSchema(endpoint);
		if (!schema) {
			L.warn(`🛟  ${path} 🚧 Please provide a valide schema`);
			schema = { type: 'object', properties: {} };
		}
	}

	app.options(path, (res) => {
		res.onAborted(() => {
			res
				.writeStatus('500')
				.writeHeader('Access-Control-Allow-Origin', '*')
				.writeHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
				.writeHeader('Access-Control-Allow-Headers', 'content-type')
				.end('Aborted');
		});
		setCorsHeaders(res);
		res.end();
	});

	const LOG = L.getSubLogger({
		stylePrettyLogs: true,
		prettyLogTemplate:
			'{{logLevelName}}\t📜 {{zencode}}.zen \t🕙 {{dateIsoStr}} \t📁 {{filePathWithLine}}\t\t',
		overwrite: {
			addPlaceholders: (logObjMeta: IMeta, placeholderValues: Record<string, string | number>) => {
				placeholderValues['zencode'] = path;
			}
		}
	});
	generateGet(app, endpoint, schema, LOG, action);
	generatePost(app, endpoint, schema, LOG, action);

	app.get(path + '/raw', (res, req) => {
		if (action === 'delete') {
			notFound(res, LOG, new Error(`Not found on ${path}/raw`));
			return;
		}
		res.writeStatus('200 OK').writeHeader('Content-Type', 'text/plain').end(contract);
	});

	app.get(path + '/app', async (res, req) => {
		if (action === 'delete') {
			notFound(res, LOG, new Error(`Not found on ${path}/app`));
			return;
		}
		const result = _.template(proctoroom)({
			contract: contract,
			schema: JSON.stringify(schema),
			title: path || 'Welcome 🥳 to ',
			description: contract,
			endpoint: `${config.basepath}${path}`
		});

		res.writeStatus('200 OK').writeHeader('Content-Type', 'text/html').end(result);
	});
	L.info(`${emoji[action]} ${config.basepath}${path}`);
};
