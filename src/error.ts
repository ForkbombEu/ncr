// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Logger, type ILogObj } from 'tslog';

export const reportZenroomError = (
	error: Error,
	l: Logger<ILogObj>
): string => {
	if (error.name === 'ZenroomError') {
		debugZen('J64 HEAP: ', l, error);
		debugZen('J64 TRACE: ', l, error);

		return error.message;
	} else if (error.message.startsWith('ParseError')) {
		l.error('Slangroom Syntax Error ', error.message);
		return error.message;
	} else {
		l.fatal(error);
		return error.message;
	}
};

/*
const debugZen = (type: 'J64 TRACE: ' | 'J64 HEAP: ', l: Logger<ILogObj>, error: Error) => {
	const trace = JSON.parse(error.message).filter((l: string) => l.startsWith(type));
	if (trace.length) {
		const content = trace[0].split(type)[1].replaceAll("'", '');
		const decodedContent = Buffer.from(content, 'base64').toString('utf8');
        
		console.table(JSON.parse(decodedContent));
	}
};
*/

import _ from 'lodash';

const debugZen = (type: 'J64 TRACE: ' | 'J64 HEAP: ', l: Logger<ILogObj>, error: Error) => {
	const trace = JSON.parse(error.message).filter((l: string) => l.startsWith(type));
	if (trace.length) {
		const content = trace[0].split(type)[1].replaceAll("'", '');
		const decodedContent = Buffer.from(content, 'base64').toString('utf8');

		if (type === 'J64 HEAP: ') {
			l.debug('J64 HEAP: ', decodedContent);
			return;
		}

		const jsonDecodedContent = JSON.parse(decodedContent);
		const transposedContent = _.zip(Object.keys(jsonDecodedContent), Object.values(jsonDecodedContent));
		console.table(transposedContent);
	}
};
