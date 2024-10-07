// SPDX-FileCopyrightText: 2024 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from 'fs';
import _ from 'lodash';
import { IMeta, Logger, type ILogObj } from 'tslog';
import { App, HttpResponse, TemplatedApp } from 'uWebSockets.js';
import { execute as slangroomChainExecute } from '@dyne/slangroom-chain';

import { reportZenroomError } from './error.js';
import { Endpoints, JSONSchema, Events, Headers } from './types.js';
import { config } from './cli.js';
import { SlangroomManager } from './slangroom.js';
import {
	forbidden,
	methodNotAllowed,
	notFound,
	unprocessableEntity,
	unsupportedMediaType
} from './responseUtils.js';
import { getSchema, validateData, getQueryParams } from './utils.js';
import { template as proctoroom } from './applets.js';

//

type MethodNames =
	| 'get'
	| 'post'
	| 'options'
	| 'del'
	| 'patch'
	| 'put'
	| 'head'
	| 'connect'
	| 'trace'
	| 'any'
	| 'ws';

export const createAppWithBasePath = (basepath: string): TemplatedApp => {
	const app = App();

	const wrapPatternMethod = (methodName: MethodNames) => {
		const originalMethod = app[methodName].bind(app);
		return (pattern: string, ...args: any[]): TemplatedApp => {
			const prefixedPattern = `${basepath}${pattern}`;
			originalMethod(prefixedPattern, ...args);
			return wrappedApp; // Return the wrapped app instance for chaining
		};
	};

	const wrapMethod = (methodName: keyof TemplatedApp) => {
		return (...args: any[]): TemplatedApp => {
			(app as any)[methodName](...args);
			return wrappedApp;
		};
	};

	const wrappedApp: TemplatedApp = {
		numSubscribers: app.numSubscribers.bind(app),
		publish: app.publish.bind(app),

		listen: (...args: any[]) => wrapMethod('listen')(...args),
		listen_unix: (...args: any[]) => wrapMethod('listen_unix')(...args),
		addServerName: (...args: any[]) => wrapMethod('addServerName')(...args),
		domain: (...args: any[]) => wrapMethod('domain')(...args),
		removeServerName: (...args: any[]) => wrapMethod('removeServerName')(...args),
		missingServerName: (...args: any[]) => wrapMethod('missingServerName')(...args),
		filter: (...args: any[]) => wrapMethod('filter')(...args),
		close: (...args: any[]) => wrapMethod('close')(...args),

		// Pattern-based methods with basepath wrapping
		get: wrapPatternMethod('get'),
		post: wrapPatternMethod('post'),
		options: wrapPatternMethod('options'),
		del: wrapPatternMethod('del'),
		patch: wrapPatternMethod('patch'),
		put: wrapPatternMethod('put'),
		head: wrapPatternMethod('head'),
		connect: wrapPatternMethod('connect'),
		trace: wrapPatternMethod('trace'),
		any: wrapPatternMethod('any'),
		ws: wrapPatternMethod('ws')
	};

	return wrappedApp;
};

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
	const zen = fs.readFileSync(preconditionPath + '.slang').toString('utf-8');
	const keys = fs.existsSync(preconditionPath + '.keys.json')
		? JSON.parse(fs.readFileSync(preconditionPath + '.keys.json').toString('utf-8'))
		: null;
	await s.execute(zen, { data, keys });
};

const parseDataFunctions = {
	'application/json': (data: string) => JSON.parse(data),
	'application/x-www-form-urlencoded': (data: string) => {
		const res: Record<string, unknown> = {};
		decodeURIComponent(data)
			.split('&')
			.map((r: string) => {
				const [k, v] = r.split('=');
				res[k] = v;
			});
		return res;
	}
};

const checkAndGetHeaders = (
	res: HttpResponse,
	req: HttpRequest,
	LOG: Logger<ILogObj>,
	action: Events,
	path: string,
	metadata: JSONSchema,
	notAllowed: boolean
): Headers | undefined => {
	if (action === 'delete') {
		notFound(res, LOG, new Error(`Not found on ${path}`));
		return;
	}
	if (notAllowed) {
		methodNotAllowed(res, LOG, new Error(`Post method not allowed on ${path}`));
		return;
	}
	const headers: Headers = {};
	headers.request = {};
	req.forEach((k, v) => {
		headers.request[k] = v;
	});
	return headers;
};

const execZencodeAndReply = async (
	res: HttpResponse,
	endpoint: Endpoints,
	data: Record<string, unknown>,
	headers: Record<string, Record<string, string>>,
	schema: JSONSchema,
	LOG: Logger<ILogObj>
) => {
	res.onAborted(() => {
		res.aborted = true;
		res.cork(() => res.writeStatus('400').end());
		return;
	});
	const { keys, conf, metadata } = endpoint;
	try {
		if (metadata.httpHeaders) {
			try {
				if ('http_headers' in data) {
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

		let jsonResult: {
			http_headers?: { response?: Record<string, string> };
		} & Record<string, unknown> = {};
		try {
			if ('chain' in endpoint) {
				const dataFormatted = data ? JSON.stringify(data) : undefined;
				const parsedChain = eval(endpoint.chain)();
				const res = await slangroomChainExecute(parsedChain, dataFormatted);
				jsonResult = JSON.parse(res);
			} else {
				const s = SlangroomManager.getInstance();
				({ result: jsonResult } = await s.execute(endpoint.contract, { keys, data, conf }));
			}
		} catch (e) {
			if (!res.aborted) {
				res.cork(() => {
					const report = reportZenroomError(e as Error, LOG);
					res
						.writeStatus(metadata.errorCode)
						.writeHeader('Access-Control-Allow-Origin', '*')
						.end(report);
				});
				return;
			}
		}
		if (metadata.httpHeaders) {
			if (jsonResult.http_headers?.response !== undefined) {
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
	app: TemplatedApp,
	endpoint: Endpoints,
	schema: JSONSchema,
	LOG: Logger<ILogObj>,
	action: Events
) => {
	const { path, metadata } = endpoint;
	app.post(path, (res, req) => {
		const headers = checkAndGetHeaders(res, req, LOG, action, path, metadata, metadata.disablePost);
		if (!headers) return;
		if (headers.request?.['content-type'] !== metadata.contentType) {
			unsupportedMediaType(res, LOG, new Error(`Unsupported media type on ${path}`));
			return;
		}
		/**
		 * Code may break on `slangroom.execute`
		 * so it's important to attach the `onAborted` handler before everything else
		 */
		res.onAborted(() => {
			res.writeStatus(metadata.errorCode ? metadata.errorCode : '500').end('Aborted');
		});
		let buffer: Buffer;
		res.onData((d, isLast) => {
			const chunk = Buffer.from(d);
			if (isLast) {
				let data;
				try {
					const parseFun = parseDataFunctions[metadata.contentType];
					if (!parseFun) {
						unsupportedMediaType(res, LOG, new Error(`Unsupported media type ${metadata.contentType}`));
					}
					data = parseFun(
						buffer ? Buffer.concat([buffer, chunk]).toString('utf-8') : chunk.toString('utf-8')
					);
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
	app: TemplatedApp,
	endpoint: Endpoints,
	schema: JSONSchema,
	LOG: Logger<ILogObj>,
	action: Events
) => {
	const { path, metadata } = endpoint;
	app.get(path, async (res, req) => {
		const headers = checkAndGetHeaders(res, req, LOG, action, path, metadata, metadata.disbaleGet);
		if (!headers) return;
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

export const generateRoute = async (app: TemplatedApp, endpoint: Endpoints, action: Events) => {
	const { path, metadata } = endpoint;
	if (metadata.hidden) return;
	let raw: string;
	if ('contract' in endpoint) {
		raw = endpoint.contract;
	} else {
		raw = endpoint.chain;
	}

	let schema: JSONSchema = { type: 'object', properties: {} };
	if (action !== 'delete') {
		const s = await getSchema(endpoint);
		if (!s) {
			L.warn(`🛟  ${path} 🚧 Please provide a valide schema`);
		} else {
			schema = s;
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

	app.get(path + '/raw', (res) => {
		if (action === 'delete') {
			notFound(res, LOG, new Error(`Not found on ${path}/raw`));
			return;
		}
		res.writeStatus('200 OK').writeHeader('Content-Type', 'text/plain').end(raw);
	});

	app.get(path + '/app', async (res) => {
		if (action === 'delete') {
			notFound(res, LOG, new Error(`Not found on ${path}/app`));
			return;
		}
		const result = _.template(proctoroom)({
			contract: raw,
			schema: JSON.stringify(schema),
			title: path || 'Welcome 🥳 to ',
			description: raw,
			endpoint: `${config.basepath}${path}`
		});

		res.writeStatus('200 OK').writeHeader('Content-Type', 'text/html').end(result);
	});
	L.info(`${emoji[action]} ${config.basepath}${path}`);
};
