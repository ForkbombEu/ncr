// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from 'fs';
import _ from 'lodash';
import { IMeta, Logger, type ILogObj } from 'tslog';
import { App, HttpRequest, HttpResponse, TemplatedApp } from 'uWebSockets.js';
import { execute as slangroomChainExecute } from '@dyne/slangroom-chain';

import { reportZenroomError } from './error.js';
import { Endpoints, JSONSchema, Events, Headers, JSONObject } from './types.js';
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

export const runPrecondition = async (preconditionPath: string, data: JSONObject) => {
	const s = SlangroomManager.getInstance();
	const zen = fs.readFileSync(preconditionPath + '.slang').toString('utf-8');
	const keys = fs.existsSync(preconditionPath + '.keys.json')
		? JSON.parse(fs.readFileSync(preconditionPath + '.keys.json').toString('utf-8'))
		: null;
	await s.execute(zen, { data, keys });
};

const parseDataFunctions: Record<string, (data: string) => Record<string, unknown>> = {
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
	action: Events,
	path: string,
	notAllowed: boolean
): Headers | undefined => {
	if (action === 'delete') {
		notFound(res, new Error(`Not found on ${path}`));
		return;
	}
	if (notAllowed) {
		methodNotAllowed(res, new Error(`Post method not allowed on ${path}`));
		return;
	}
	const headers: Headers = {};
	headers.request = {};
	req.forEach((k: string, v: string) => {
		headers.request![k] = v;
	});
	return headers;
};

const execZencodeAndReply = async (
	res: HttpResponse,
	endpoint: Endpoints,
	data: JSONObject,
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
				unprocessableEntity(res, e as Error);
				return;
			}
		}
		if (metadata.precondition) {
			try {
				await runPrecondition(metadata.precondition, data);
			} catch (e) {
				forbidden(res, e as Error);
				return;
			}
		}

		try {
			validateData(schema, data);
		} catch (e) {
			unprocessableEntity(res, e as Error);
			return;
		}

		let jsonResult: {
			http_headers?: { response?: Record<string, string> };
		} & Record<string, unknown> = {};
		try {
			if ('chain' in endpoint) {
				const dataFormatted = data ? JSON.stringify(data) : undefined;
				const parsedChain = endpoint.chainExt === 'js' ? eval(endpoint.chain)() : endpoint.chain;
				const slangRes = await slangroomChainExecute(parsedChain, dataFormatted);
				jsonResult = JSON.parse(slangRes);
			} else {
				const s = SlangroomManager.getInstance();
				({ result: jsonResult } = await s.execute(endpoint.contract, { keys, data, conf }));
			}
		} catch (e) {
			LOG.error(e);
			if (!res.aborted) {
				res.cork(() => {
					let ze = e as string;
					try {
						ze = reportZenroomError(e as Error, LOG);
					} catch (zenErr) {
						LOG.error(zenErr);
					}
					res
						.writeStatus(metadata.errorCode)
						.writeHeader('Access-Control-Allow-Origin', '*')
						.end(ze);
				});
			}
			return;
		}
		if (metadata.httpHeaders) {
			if (jsonResult.http_headers?.response !== undefined) {
				headers.response = jsonResult.http_headers.response;
			}
			delete jsonResult.http_headers;
		}
		const slangroomResult = JSON.stringify(jsonResult);
		if (!res.aborted) {
			res.cork(() => {
				res
					.writeStatus(metadata.successCode)
					.writeHeader('Content-Type', metadata.successContentType)
					.writeHeader('Access-Control-Allow-Origin', '*');

				if (metadata.httpHeaders && headers.response !== undefined) {
					for (const [k, v] of Object.entries(headers.response)) {
						res.writeHeader(k, v);
					}
				}
				res.end(slangroomResult);
			});
		}
		return;
	} catch (e) {
		LOG.fatal(e);
		if (!res.aborted) {
			res.cork(() =>
				res
					.writeStatus(metadata.errorCode)
					.writeHeader('Access-Control-Allow-Origin', '*')
					.end((e as Error).message)
			);
		}
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
		const headers = checkAndGetHeaders(res, req, action, path, metadata.disablePost);
		if (!headers) return;
		if (headers.request?.['content-type'] !== metadata.contentType) {
			unsupportedMediaType(res, new Error(`Unsupported media type on ${path}`));
			return;
		}
		/**
		 * Code may break on `slangroom.execute`
		 * so it's important to attach the `onAborted` handler before everything else
		 */
		res.onAborted(() => {
			res.aborted = true;
			res.cork(() =>
				res.writeStatus(metadata.errorCode ? metadata.errorCode : '500').end('Aborted')
			);
			return;
		});
		let buffer: Buffer;
		res.onData((d, isLast) => {
			const chunk = Buffer.from(d);
			if (isLast) {
				let data;
				try {
					const parseFun: (data: string) => Record<string, unknown> =
						parseDataFunctions[metadata.contentType];
					if (!parseFun) {
						unsupportedMediaType(res, new Error(`Unsupported media type ${metadata.contentType}`));
						return;
					}
					data = parseFun(
						buffer ? Buffer.concat([buffer, chunk]).toString('utf-8') : chunk.toString('utf-8')
					) as JSONObject;
				} catch (e) {
					L.error(e);
					if (!res.aborted) {
						res.cork(() =>
							res
								.writeStatus(metadata.errorCode)
								.writeHeader('Access-Control-Allow-Origin', '*')
								.end((e as Error).message)
						);
					}
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
		const headers = checkAndGetHeaders(res, req, action, path, metadata.disableGet);
		if (!headers) return;
		/**
		 * Code may break on `slangroom.execute`
		 * so it's important to attach the `onAborted` handler before everything else
		 */
		res.onAborted(() => {
			res.aborted = true;
			res.cork(() =>
				res.writeStatus(metadata.errorCode ? metadata.errorCode : '500').end('Aborted')
			);
			return;
		});

		try {
			const data = getQueryParams(req) as JSONObject;
			execZencodeAndReply(res, endpoint, data, headers, schema, LOG);
		} catch (e) {
			LOG.fatal(e);
			if (!res.aborted) {
				res.cork(() => res.writeStatus(metadata.errorCode).end((e as Error).message));
			}
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
			notFound(res, new Error(`Not found on ${path}/raw`));
			return;
		}
		if (!res.aborted) {
			res.cork(() => res.writeStatus('200 OK').writeHeader('Content-Type', 'text/plain').end(raw));
		}
	});

	app.get(path + '/app', async (res) => {
		if (action === 'delete') {
			notFound(res, new Error(`Not found on ${path}/app`));
			return;
		}
		const result = _.template(proctoroom)({
			contract: raw,
			schema: JSON.stringify(schema),
			title: path || 'Welcome 🥳 to ',
			description: raw,
			endpoint: `${config.basepath}${path}`
		});

		if (!res.aborted) {
			res.cork(() =>
				res.writeStatus('200 OK').writeHeader('Content-Type', 'text/html').end(result)
			);
		}
	});
	L.info(`${emoji[action]} ${config.basepath}${path}`);
};
