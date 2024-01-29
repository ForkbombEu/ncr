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
	metadata: Metadata;
}

interface CodecAttr {
	encoding: 'string' | 'float';
	name: string;
	zentype: 'd' | 'a' | 'e';
}

export interface Codec {
	[key: string]: CodecAttr;
}

export interface Metadata {
	httpHeaders: boolean;
}
