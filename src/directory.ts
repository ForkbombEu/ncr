// SPDX-FileCopyrightText: 2024 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from 'fs';
import LiveDirectory from 'live-directory';
import { config } from './cli.js';
import { formatContract } from './fileUtils.js';
import { Endpoints } from './types.js';
import { newMetadata, validateJSONSchema } from './utils.js';

export class Directory {
	private static instance: Directory;
	private liveDirectory: LiveDirectory;

	private constructor() {
		this.liveDirectory = new LiveDirectory(config.zencodeDirectory, {
			static: false,
			filter: {
				keep: (path, stats) => {
					return (
						path.endsWith('.zen') ||
						path.endsWith('.conf') ||
						path.endsWith('.keys.json') ||
						path.endsWith('.data.json') ||
						path.endsWith('.schema.json') ||
						path.endsWith('.metadata.json') ||
						path.endsWith('.chain.js')
					);
				}
			},
			ignore: {
				// extensions: ['keys']
			}
		});
	}

	private getContent(name: string) {
		const lf = this.liveDirectory.get(name);
		if (lf == null) return lf;
		if (lf.cached) return lf.content.toString('utf-8');
		else return fs.readFileSync(lf.path).toString('utf-8');
	}

	public static getInstance(): Directory {
		if (!Directory.instance) {
			Directory.instance = new Directory();
		}
		return Directory.instance;
	}

	get paths() {
		return this.files.map(({ path }) => path);
	}

	get files() {
		const result: Endpoints[] = [];
		this.liveDirectory.files.forEach((c, f) => {
			const [path, ext, json] = f.split('.');
			if (ext === 'zen') {
				result.push({
					path: path,
					contract: formatContract(this.getContent(f)),
					keys: this.getJSON(path, 'keys'),
					conf: this.getContent(path + '.conf') || '',
					schema: this.getJSONSchema(path),
					metadata: newMetadata(this.getJSON(path, 'metadata') || {})
				});
			} else if (ext == 'chain' && json == 'js') {
				result.push({
					path: path,
					chain: this.getContent(f),
					schema: this.getJSONSchema(path),
					metadata: newMetadata(this.getJSON(path, 'metadata') || {})
				});
			}
		});
		return result;
	}

	private getJSON(path: string, type: 'schema' | 'keys' | 'metadata' | 'chain') {
		try {
			const k = this.getContent(`${path}.${type}.json`);
			if (!k) return undefined;
			else return JSON.parse(k);
		} catch (_e) {
			throw new Error(`${path}.${type}.json: malformed JSON`);
		}
	}

	private getJSONSchema(path: string) {
		try {
			const schema = this.getJSON(path, 'schema');
			if (!schema) return undefined;
			validateJSONSchema(schema);
			return schema;
		} catch (e) {
			throw e;
		}
	}

	public ready(cb: (...args: any[]) => void) {
		this.liveDirectory.once('ready', cb);
	}

	public onChange(cb: (...args: any[]) => void) {
		this.liveDirectory.on('add', cb);
	}
}
