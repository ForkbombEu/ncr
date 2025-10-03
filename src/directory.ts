// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { join, resolve, parse } from 'path';
import fs from 'fs';
import LiveDirectory from 'live-directory';
import { config } from './cli.js';
import { formatContract } from './fileUtils.js';
import { Endpoints } from './types.js';
import { newMetadata, validateJSONSchema } from './utils.js';
import {
	FILE_EXTENSIONS,
	getBasePath,
	getContractPath,
	getChainPath,
	isChainFile,
	isConfigFile,
	isContractFile,
	isZencodeCompanionFile
} from './pathUtils.js';

export class Directory {
	private static instance: Directory;
	private liveDirectory: LiveDirectory;

	// This should keep track of file that ends up with:
	// * .[zen]
	// * .[chain].[js|yaml|yml]
	// * .[keys|data|metdata|schema].json
	// * .conf
	// that are present in the zencodeDirectory and outside of the autorun folder
	private constructor() {
		const autorunDir = join(resolve(config.zencodeDirectory), '.autorun');
		this.liveDirectory = new LiveDirectory(config.zencodeDirectory, {
			static: false,
			filter: {
				keep: (path: string): boolean => {
					return (
						isContractFile(path) ||
						isChainFile(path) ||
						isZencodeCompanionFile(path) ||
						isConfigFile(path)
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
		if (isContractFile(name)) {
			const contractPath = getContractPath(name);
			return {
				path: contractPath,
				contract: formatContract(this.getContent(name) || ''),
				keys: this.getJSON(contractPath, 'keys'),
				conf: this.getContent(`${contractPath}${FILE_EXTENSIONS.config}`) || '',
				schema: this.getJSONSchema(contractPath),
				metadata: newMetadata(this.getJSON(contractPath, 'metadata') || {})
			};
		} else if (isChainFile(name)) {
			const chainPath = getChainPath(name);
			return {
				path: chainPath,
				chain: this.getContent(name) || '',
				keys: this.getJSON(chainPath, 'keys'),
				chainExt: parse(name).ext,
				schema: this.getJSONSchema(chainPath),
				metadata: newMetadata(this.getJSON(chainPath, 'metadata') || {}),
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
		// If the path is a zencode contract/chain, return its endpoint
		if (isContractFile(path) || isChainFile(path)) {
			return this.getEndpoint(path);
		}
		// Otherwise, try to resolve by checking possible extensions
		const basePath = getBasePath(path);
		const possibleExtensions = [
			...FILE_EXTENSIONS.contract,
			...FILE_EXTENSIONS.chainQualifiers.flatMap((qualifier) =>
				FILE_EXTENSIONS.chain.map((ext) => `${qualifier}${ext}`)
			)
		];
		for (const ext of possibleExtensions) {
			const candidate = `${basePath}${ext}`;
			if (this.liveDirectory.get(candidate)) return this.getEndpoint(candidate);
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
