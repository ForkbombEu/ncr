// SPDX-FileCopyrightText: 2024 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { config } from './cli.js';
import { join, dirname } from 'path';
import { writeFile, mkdir } from 'node:fs/promises';

// TODO: add dev page html

const jsonStringPrettify = (str: string): string => {
	try {
		const json = JSON.parse(str);
		return JSON.stringify(json, null, 2);
	} catch {
		return str;
	}
}

export const devApis = (app): void => {
	if (!config.dev) return;
	app.options(`${config.devPath}/save`, (res) => {
		res.onAborted(() => {
			res
				.writeStatus('500')
				.writeHeader('Access-Control-Allow-Origin', '*')
				.writeHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
				.writeHeader('Access-Control-Allow-Headers', 'content-type')
				.end('Aborted');
		});
		res
			.writeHeader('Access-Control-Allow-Origin', '*')
			.writeHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
			.writeHeader('Access-Control-Allow-Headers', 'content-type, authorization');;
		res.end();
  });
	app
		.get(config.devPath, (res) =>
			res.cork(() => {
				res
					.writeStatus('200 OK')
					.writeHeader('Content-Type', 'text/html')
					.end(devPage);
				return;
			})
		    )
		.post('/dev/save', (res, req) => {
			res.onAborted(() => {
				res.writeStatus('500').end('Aborted');
			});
			let buffer: Buffer;
			res.onData(async (d, isLast) => {
				const chunk = Buffer.from(d);
				if (isLast) {
					const raw = buffer ? Buffer.concat([buffer, chunk]).toString('utf-8') : chunk.toString('utf-8');
					const data = JSON.parse(raw);
					const filePath = join(config.zencodeDirectory, data.name);
					const dir = dirname(filePath);
					await mkdir(dir, { recursive: true }, (err) => {if (err) throw err;});
					await writeFile(`${filePath}.zen`, data.contract);
					await writeFile(`${filePath}.keys.json`, jsonStringPrettify(data.keys));
					await writeFile(`${filePath}.schema.json`, jsonStringPrettify(data.schema));
					await writeFile(`${filePath}.metadata.json`, jsonStringPrettify(data.metadata));
					res.cork(() => {
						res
							.writeStatus('200 OK')
							.writeHeader('Access-Control-Allow-Origin', '*')
							.end();
					});
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
}
