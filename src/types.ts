import type { Logger } from 'pino';

export interface Config {
	port: number;
	hostname: string;
	zencodeDirectory: string;
	zenroomVersion: string;
	openapiPath: string;
	template: string;
	logger: Logger;
}

export interface Endpoints {
	path: string;
	contract: string;
	keys: JSON;
	conf: string;
}

interface CodecAttr {
	encoding: 'string' | 'number';
	name: string;
	zentype: 'n' | 'y';
}

export interface Codec {
	[key: string]: CodecAttr;
}
