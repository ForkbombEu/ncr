// SPDX-FileCopyrightText: 2024 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Logger, type ILogObj } from 'tslog';
import { HttpResponse } from 'uWebSockets.js';

const response = (
	res: HttpResponse,
	LOG: Logger<ILogObj>,
	e: Error,
	statusCode: string,
	msg: string | undefined = undefined
) => {
	if (res.aborted) return;
	LOG.error(e);
	res.cork(() => {
		res
			.writeStatus(statusCode)
			.writeHeader('Content-Type', 'application/json')
			.writeHeader('Access-Control-Allow-Origin', '*')
			.end(msg || e.message);
	});
};

export const forbidden = (res: HttpResponse, LOG: Logger<ILogObj>, e: Error) => {
	response(res, LOG, e, '403 FORBIDDEN', 'Forbidden');
};

export const notFound = (res: HttpResponse, LOG: Logger<ILogObj>, e: Error) => {
	response(res, LOG, e, '404 NOT FOUND', 'Not Found');
};

export const methodNotAllowed = (res: HttpResponse, LOG: Logger<ILogObj>, e: Error) => {
	response(res, LOG, e, '405 METHOD NOT ALLOWED', 'Method Not Allowed');
};

export const unprocessableEntity = (res: HttpResponse, LOG: Logger<ILogObj>, e: Error) => {
	response(res, LOG, e, '422 UNPROCESSABLE ENTITY');
};

export const unsupportedMediaType = (res: HttpResponse, LOG: Logger<ILogObj>, e: Error) => {
	response(res, LOG, e, '415 UNSUPPORTED MEDIA TYPE', 'Unsupported Media Type');
};

export const internalServerError = (res: HttpResponse, LOG: Logger<ILogObj>, e: Error) => {
	response(res, LOG, e, '500 INTERNAL SERVER ERROR');
};
