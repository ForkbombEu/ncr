import { Logger } from 'pino';

interface IndexableJSON {
	[key: string]: unknown | IndexableJSON;
}

export type JSONSchema = {
	type: 'object';
	properties: IndexableJSON;
	required?: Array<string>;
};

export interface Config {
	port: number;
	hostname: string;
	zencodeDirectory: string;
	zenroomVersion: string;
	openapiPath: string;
	template: string;
	logger: Logger;
	publicDirectory: string | undefined;
}

export interface Endpoints {
	path: string;
	contract: string;
	keys?: JSON | undefined;
	conf: string;
	schema?: JSONSchema | undefined;
}

interface CodecAttr {
	encoding: 'string' | 'number';
	name: string;
	zentype: 'n' | 'y';
}

export interface Codec {
	[key: string]: CodecAttr;
}
