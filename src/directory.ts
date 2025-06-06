// SPDX-FileCopyrightText: 2024 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { join, resolve } from 'path';
import fs from 'fs';
import LiveDirectory from 'live-directory';
import { config } from './cli.js';
import { formatContract } from './fileUtils.js';
import { Endpoints } from './types.js';
import { FILE_EXTENSIONS, newMetadata, validateJSONSchema } from './utils.js';

export class Directory {
	private static instance: Directory;
	private liveDirectory: LiveDirectory;

	// This should keep track of file that ends up with:
	// * .[zen]
	// * .[chain].js
	// * .[keys|data|metdata|schema].json
	// * .conf
	// that are present in the zencodeDirectory and outside of the autorun folder
	private constructor() {
		const autorunDir = join(resolve(config.zencodeDirectory), '.autorun');
		this.liveDirectory = new LiveDirectory(config.zencodeDirectory, {
			static: false,
			filter: {
				keep: (path: string): boolean => {
					const pathArray = path.split('.');
					if (pathArray.length < 2) return false;
					const ext = pathArray.pop() as string;
					const intermediateExtension = pathArray.pop() as string;
					return (
						FILE_EXTENSIONS.contractExtension.includes(ext) ||
						Boolean(
							FILE_EXTENSIONS.chainExtension.includes(ext) &&
							FILE_EXTENSIONS.chainIntermediateExtension.includes(intermediateExtension) &&
							pathArray.pop()
						) ||
						Boolean(
							ext === FILE_EXTENSIONS.jsonExtension &&
							FILE_EXTENSIONS.jsonIntermediateExtension.includes(intermediateExtension) &&
							pathArray.pop()
						) ||
						ext === FILE_EXTENSIONS.confExtension
					);
				},
				ignore: (path: string): boolean => path.startsWith(autorunDir)
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
		if (FILE_EXTENSIONS.contractExtension.includes(ext)) {
			const path = pathArray.pop() as string;
			return {
				path: path,
				contract: formatContract(this.getContent(name) || ''),
				keys: this.getJSON(path, 'keys'),
				conf: this.getContent(`${path}.${FILE_EXTENSIONS.confExtension}`) || '',
				schema: this.getJSONSchema(path),
				metadata: newMetadata(this.getJSON(path, 'metadata') || {})
			};
		} else if (
			FILE_EXTENSIONS.chainExtension.includes(ext) &&
			FILE_EXTENSIONS.chainIntermediateExtension.includes(pathArray.pop() as string)
		) {
			const path = pathArray.pop() as string;
			return {
				path: path,
				chain: this.getContent(name) || '',
				chainExt: ext,
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
			FILE_EXTENSIONS.contractExtension.includes(ext) ||
			(FILE_EXTENSIONS.chainExtension.includes(ext) && FILE_EXTENSIONS.chainIntermediateExtension.includes(pathArray.pop() as string))
		) {
			return this.getEndpoint(path);
		} else {
			const basePath = pathArray.shift();
			const correctExtenstion = [
				...FILE_EXTENSIONS.contractExtension,
				...FILE_EXTENSIONS.chainIntermediateExtension.flatMap((i) => FILE_EXTENSIONS.chainExtension.map((e) => `${i}.${e}`)),
			].find((e) => this.getContent(`${basePath}.${e}`));
			if (correctExtenstion) {
				return this.getEndpoint(`${basePath}.${correctExtenstion}`);
			}
		}
		return undefined;
	}

	private getJSON(path: string, type: 'schema' | 'keys' | 'metadata' | 'chain') {
		try {
			const k = this.getContent(`${path}.${type}.${FILE_EXTENSIONS.jsonExtension}`);
			if (!k) return undefined;
			else return JSON.parse(k);
		} catch {
			throw new Error(`${path}.${type}.${FILE_EXTENSIONS.jsonExtension}: malformed JSON`);
		}
	}

	private getJSONSchema(path: string) {
		const schema = this.getJSON(path, 'schema');
		if (!schema) return undefined;
		validateJSONSchema(schema);
		return schema;
	}

	public ready(cb: () => void) {
		this.liveDirectory.once('ready', cb);
	}

	private onChange(event: string, cb: (path: string) => void) {
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
