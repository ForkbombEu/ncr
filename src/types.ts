import type { ILogObj, Logger } from 'tslog';
import { RecognizedString } from 'uWebSockets.js';

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
	logger: Logger<ILogObj>;
	publicDirectory: string | undefined;
}

export interface Endpoints {
	path: string;
	contract?: string | undefined;
	chain?: JSON | undefined;
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
	hidden: boolean;
	hideFromOpenapi: boolean;
	disableGet: boolean;
	disablePost: boolean;

	contentType: RecognizedString;
	httpHeaders: boolean;

	successCode: RecognizedString;
	successContentType: RecognizedString;
	successDescription: RecognizedString;

	errorCode: RecognizedString;
	errorDescription: RecognizedString;
	errorContentType: RecognizedString;

	examples: {};
	tags: Array<string>;
}
