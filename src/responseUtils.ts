// SPDX-FileCopyrightText: 2024 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Logger, type ILogObj } from 'tslog';
import { HttpResponse } from 'uWebSockets.js';

export const forbidden = (res: HttpResponse, LOG: Logger<ILogObj>, e: Error) => {
	if (res.aborted) return;
	LOG.fatal(e.message);
	res.cork(() => {
		res
			.writeStatus('403 FORBIDDEN')
			.writeHeader('Content-Type', 'application/json')
			.writeHeader('Access-Control-Allow-Origin', '*')
			.end('Forbidden');
	});
};

export const notFound = (res: HttpResponse, LOG: Logger<ILogObj>, e: Error) => {
	if (res.aborted) return;
	LOG.fatal(e.message);
	res.cork(() => {
		res
			.writeStatus('404 NOT FOUND')
			.writeHeader('Content-Type', 'application/json')
			.writeHeader('Access-Control-Allow-Origin', '*')
			.end('Not Found');
	});
};

export const methodNotAllowed = (res: HttpResponse, LOG: Logger<ILogObj>, e: Error) => {
	if (res.aborted) return;
	LOG.warn(e.message);
	res.cork(() => {
		res
			.writeStatus('405 METHOD NOT ALLOWED')
			.writeHeader('Content-Type', 'application/json')
			.writeHeader('Access-Control-Allow-Origin', '*')
			.end('Method Not Allowed');
	});
};

export const unprocessableEntity = (res: HttpResponse, LOG: Logger<ILogObj>, e: Error) => {
	if (res.aborted) return;
	LOG.fatal(e.message);
	res.cork(() => {
		res
			.writeStatus('422 UNPROCESSABLE ENTITY')
			.writeHeader('Content-Type', 'application/json')
			.writeHeader('Access-Control-Allow-Origin', '*')
			.end(e.message);
	});
};

export const internalServerError = (res: HttpResponse, LOG: Logger<ILogObj>, e: Error) => {
	if (res.aborted) return;
	LOG.fatal(e.message);
	res.cork(() => {
		res
			.writeStatus('500 INTERNAL SERVER ERROR')
			.writeHeader('Content-Type', 'application/json')
			.writeHeader('Access-Control-Allow-Origin', '*')
			.end(e.message);
	});
};
