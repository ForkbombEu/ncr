import { Logger } from 'pino';

export interface Config {
	port: number;
	hostname: string;
	zencodeDirectory: string;
	zenroomVersion: string;
	openapiPath: string;
	template: string;
	logger: Logger;
}

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export interface JSONObject {
	[k: string]: JSONValue;
}
interface JSONArray extends Array<JSONValue> {}

export interface Endpoints {
	path: string;
	contract: string;
	keys: JSONObject;
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
