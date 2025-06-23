// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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

type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export type JSONObject = { [key: string]: JSONValue };

export interface Config {
	port: number;
	hostname: string;
	zencodeDirectory: string;
	zenroomVersion: string;
	openapiPath: string;
	openapiInfo: string;
	template: string;
	logger: Logger<ILogObj>;
	publicDirectory: string | undefined;
	basepath: string;
}

export type Endpoints = {
	path: string;
	keys?: JSONObject;
	conf: string;
	schema?: JSONSchema;
	metadata: Metadata;
} & (
	| { contract: string }
	| { chain: string, chainExt: string }
)

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

	contentType: string;
	httpHeaders: boolean;

	successCode: RecognizedString;
	successContentType: RecognizedString;
	successDescription: RecognizedString;

	errorCode: RecognizedString;
	errorDescription: RecognizedString;
	errorContentType: RecognizedString;

	examples: {};
	tags: Array<string>;

	precondition?: string
}

export interface MetadataRaw {
	hidden?: boolean;
	hide_from_openapi?: boolean;
	disable_get?: boolean;
	disable_post?: boolean;

	content_type?: string;
	http_headers?: boolean;

	success_code?: RecognizedString;
	success_content_type?: RecognizedString;
	success_description?: RecognizedString;

	error_code?: RecognizedString;
	error_description?: RecognizedString;
	error_content_type?: RecognizedString;

	examples?: {};
	tags?: Array<string>;

	precondition?: string
}


export enum Events {
	Add = "add",
	Update = "update",
	Delete = "delete"
}

export type Headers = {
	request?: Record<string, string>;
	response?: Record<string, string>;
};