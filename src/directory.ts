// SPDX-FileCopyrightText: 2024 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from 'fs';
import LiveDirectory from 'live-directory';
import { config } from './cli.js';
import { formatContract } from './fileUtils.js';
import { Endpoints } from './types.js';
import { FILE_EXTENSIONS, newMetadata, validateJSONSchema } from './utils.js';

export class Directory {
	private static instance: Directory;
	private liveDirectory: LiveDirectory;

	private constructor() {
		this.liveDirectory = new LiveDirectory(config.zencodeDirectory, {
			static: false,
			filter: {
				keep: (path) => {
					const pathArray = path.split('.');
					if (pathArray.length < 2) return false;
					const ext = pathArray.pop() as string;
					const secondExt = pathArray.pop() as string;
					return (
						FILE_EXTENSIONS.contract.includes(ext) ||
						(ext === FILE_EXTENSIONS.js && FILE_EXTENSIONS.chain.includes(secondExt)) ||
						(ext === FILE_EXTENSIONS.json && FILE_EXTENSIONS.jsonDouble.includes(secondExt)) ||
						ext === FILE_EXTENSIONS.conf
					);
				},
				ignore: {
					// extensions: ['keys']
				}
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

	private getEndpoint(name: string) {
		const pathArray = name.split('.');
		const ext = pathArray.pop() as string;
		if (FILE_EXTENSIONS.contract.includes(ext)) {
			const path = pathArray.pop() as string;
			return {
				path: path,
				contract: formatContract(this.getContent(name) || ''),
				keys: this.getJSON(path, 'keys'),
				conf: this.getContent(`${path}.${FILE_EXTENSIONS.conf}`) || '',
				schema: this.getJSONSchema(path),
				metadata: newMetadata(this.getJSON(path, 'metadata') || {})
			};
		} else if (ext === FILE_EXTENSIONS.js && FILE_EXTENSIONS.chain.includes(pathArray.pop() as string)) {
			const path = pathArray.pop() as string;
			return {
				path: path,
				chain: this.getContent(name) || '',
				schema: this.getJSONSchema(path),
				metadata: newMetadata(this.getJSON(path, 'metadata') || {}),
				conf: ''
			};
		}
		return;
	}

	get files() {
		const result: Endpoints[] = [];
		this.liveDirectory.files.forEach((c, f) => {
			const res = this.getEndpoint(f);
			if (res) result.push(res);
		});
		return result;
	}

	public endpoint(path: string): Endpoints | undefined {
		const pathArray = path.split('.');
		const ext = pathArray.pop() as string;
		if (
			FILE_EXTENSIONS.contract.includes(ext) ||
			(ext === FILE_EXTENSIONS.js && FILE_EXTENSIONS.chain.includes(pathArray.pop() as string))
		) {
			return this.getEndpoint(path);
		} else {
			const basePath = pathArray.shift();
			const correctExtenstion = [
				...FILE_EXTENSIONS.contract,
				...FILE_EXTENSIONS.chain.map((e) => `${e}.${FILE_EXTENSIONS.js}`)
			].find((e) => this.getContent(`${basePath}.${e}`));
			if (correctExtenstion) {
				return this.getEndpoint(`${basePath}.${correctExtenstion}`);
			}
		}
		return undefined;
	}

	private getJSON(path: string, type: 'schema' | 'keys' | 'metadata' | 'chain') {
		try {
			const k = this.getContent(`${path}.${type}.${FILE_EXTENSIONS.json}`);
			if (!k) return undefined;
			else return JSON.parse(k);
		} catch {
			throw new Error(`${path}.${type}.${FILE_EXTENSIONS.json}: malformed JSON`);
		}
	}

	private getJSONSchema(path: string) {
		const schema = this.getJSON(path, 'schema');
		if (!schema) return undefined;
		validateJSONSchema(schema);
		return schema;
	}

	public ready(cb: (...args: any[]) => void) {
		this.liveDirectory.once('ready', cb);
	}

	private onChange(event: string, cb: (...args: any[]) => void) {
		this.liveDirectory.on(event, cb);
	}

	public onAdd(cb: (path: string) => void) {
		this.onChange('add', cb);
	}

	public onUpdate(cb: (path: string) => void) {
		this.onChange('update', cb);
	}

	public onDelete(cb: (path: string) => void) {
		this.onChange('delete', cb);
	}
}
