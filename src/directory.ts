import LiveDirectory from 'live-directory';
import { config } from './cli.js';

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

interface JSONObject {
	[k: string]: JSONValue;
}
interface JSONArray extends Array<JSONValue> {}

interface Endpoints {
	path: string;
	contract: string;
	keys: JSONObject;
	conf: string;
}

export class Directory {
	private static instance: Directory;
	private liveDirectory: LiveDirectory;
	private constructor() {
		this.liveDirectory = new LiveDirectory(config.zencodeDirectory, {
			static: false,
			filter: {
				keep: {
					extensions: ['zen', 'schema', 'conf']
				},
				ignore: {
					extensions: ['keys']
				}
			}
		});
	}
	private getContent(name: string) {
		return Buffer.from(this.liveDirectory.get(name)?.content || '').toString();
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
						Buffer.from(c.content).toString(),
					keys: this.getKeys(path),
					conf: this.getContent(path + '.conf') || ''
				});
			}
		});
		return result;
	}

	private getKeys(path: string) {
		try {
			return JSON.parse(this.getContent(path + '.keys'));
		} catch (_e) {
			return {};
		}
	}

	public ready(cb: (...args: any[]) => void) {
		this.liveDirectory.once('ready', cb);
	}

	public onChange(cb: (...args: any[]) => void) {
		this.liveDirectory.on('add', cb);
	}
}
