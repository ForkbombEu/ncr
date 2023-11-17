import LiveDirectory from 'live-directory';
import { config } from './cli.js';
import { Endpoints } from './types.js';
import { validateJSONSchema } from './utils.js';

export class Directory {
	private static instance: Directory;
	private liveDirectory: LiveDirectory;

	private constructor() {
		this.liveDirectory = new LiveDirectory(config.zencodeDirectory, {
			static: false,
			filter: {
				keep: {
					extensions: ['zen', 'conf', 'json']
				},
				ignore: {
					// extensions: ['keys']
				}
			}
		});
	}

	private getContent(name: string) {
		return this.liveDirectory.get(name)?.content.toString('utf-8');
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
			const [path, ext] = f.split('.');
			if (ext === 'zen') {
				result.push({
					path: path,
					contract:
						`Rule unknown ignore\nRule check version ${config.zenroomVersion}\n` +
						Buffer.from(c.content).toString('utf-8'),
					keys: this.getKeys(path),
					conf: this.getContent(path + '.conf') || '',
					schema: this.getJSONSchema(path)
				});
			}
		});
		return result;
	}

	private getKeys(path: string) {
		try {
			const k = this.getContent(path + '.keys.json');
			if (k) return JSON.parse(k);
		} catch (_e) {
			throw new Error(`${path}.keys malformed JSON`);
		}
	}

	private getJSON(path: string, type: 'schema' | 'keys') {
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
