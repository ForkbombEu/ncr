import LiveDirectory from 'live-directory';
import { config } from './cli.js';
import { Endpoints } from './types.js';

export class PublicDirectory {
	private static instance: PublicDirectory;
	private liveDirectory: LiveDirectory;

	private constructor() {
		this.liveDirectory = new LiveDirectory('public', {
			static: false
		});
	}

	private getContent(name: string) {
		return this.liveDirectory.get(name)?.content.toString('utf-8');
	}

	public static getInstance(): PublicDirectory {
		if (!PublicDirectory.instance) {
			PublicDirectory.instance = new PublicDirectory();
		}
		return PublicDirectory.instance;
	}

	// get paths() {
	// 	return this.files.map(({ path }) => path);
	// }

	get files() {
		return this.liveDirectory.files;
	}

	public ready(cb: (...args: any[]) => void) {
		this.liveDirectory.once('ready', cb);
	}

	public onChange(cb: (...args: any[]) => void) {
		this.liveDirectory.on('add', cb);
	}
}
