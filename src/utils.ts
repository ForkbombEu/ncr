// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Type } from '@sinclair/typebox';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import betterAjvErrors from 'better-ajv-errors';
import _ from 'lodash';
import { introspect } from 'zenroom';
import { config } from './cli.js';
import { Codec, Endpoints, JSONSchema, Metadata, MetadataRaw } from './types';
import { defaultTagsName } from './openapi.js';
import { HttpRequest } from 'uWebSockets.js';
const L = config.logger;

export const FILE_EXTENSIONS = {
	confExtension: 'conf',
	contractExtension: ['zen'],
	chainIntermediateExtension: ['chain'],
	chainExtension: ['js', 'yaml', 'yml'],
	jsonIntermediateExtension: ['data', 'keys', 'schema', 'metadata'],
	jsonExtension: 'json',
}

//

export async function getSchema(endpoints: Endpoints): Promise<JSONSchema | undefined> {
	const { keys } = endpoints;
	let schema = endpoints.schema;
	if ('chain' in endpoints) return schema;
	schema = schema ?? (await getSchemaFromIntrospection(endpoints.contract));
	if (!keys) return schema;
	else if (schema) return removeKeysFromSchema(schema, keys);
}

export async function getSchemaFromIntrospection(
	contract: string
): Promise<JSONSchema | undefined> {
	const codec: Codec | string = await introspect(contract);
	if (typeof codec === 'string')
		return undefined;
	const encodingToType = {
		string: Type.String(),
		float: Type.Number()
	};
	const schema = Type.Object(
		Object.fromEntries(
			Object.values(codec).map(({ name, zentype, encoding }) => {
				let t;
				switch (zentype) {
					case 'd':
						t = Type.Record(Type.String(), encodingToType[encoding]);
						break;
					case 'a':
						t = Type.Array(encodingToType[encoding]);
						break;
					default:
						t = encodingToType[encoding];
						break;
				}
				return [name, t];
			})
		)
	);
	return schema;
}

export function removeKeysFromSchema(schema: JSONSchema, keys: JSON): JSONSchema {
	let { properties, required } = _.cloneDeep(schema);

	Object.keys(keys).forEach((k) => {
		if (Object.keys(properties).includes(k)) {
			properties = _.omit(properties, k);
		}
		if (required && required.includes(k)) {
			required = _.without(required, k);
		}
	});

	return {
		type: 'object',
		properties,
		required
	};
}

export const validateData = (schema: JSONSchema, data: JSON | Record<string, unknown>) => {
	const ajv = createAjv();
	try {
		const validate = ajv.compile(schema);
		const valid = validate(data);
		if (!valid)
			throw new Error(
				validate.errors
					? betterAjvErrors(schema, data, validate.errors)
					: 'Unexpected error on data validation'
			);
	} catch (e) {
		L.error(e);
		throw e;
	}
	return data;
};

//

export const handleArrayBuffer = (message: ArrayBuffer | string) => {
	if (message instanceof ArrayBuffer) {
		const decoder = new TextDecoder();
		return JSON.parse(decoder.decode(message));
	}
	return JSON.parse(message);
};

//

export function validateJSONSchema(schema: JSON): void {
	const ajv = createAjv();
	ajv.compile(schema);
}

/*
 * The JSON in input and Metadata use a different convention:
 * - JSON is snake case
 * - Metadata is camel case
 * The reason is that Metadata uses the convention of javascript,
 * while the input JSON the one from zenroom
 */
export const newMetadata = (configRaw: MetadataRaw): Metadata => {
	return {
		httpHeaders: configRaw['http_headers'] || false,
		errorCode: configRaw['error_code'] || '500',
		successCode: configRaw['success_code'] || '200',
		successDescription:
			configRaw['success_description'] || 'The zencode execution output, splitted by newline',
		errorDescription: configRaw['error_description'] || 'Zenroom execution error',
		contentType: configRaw['content_type'] || 'application/json',
		disableGet: configRaw['disable_get'] || false,
		disablePost: configRaw['disable_post'] || false,
		successContentType: configRaw['success_content_type'] || 'application/json',
		errorContentType: configRaw['error_content_type'] || 'plain/text',
		examples: configRaw['examples'] || {},
		tags: configRaw['tags'] || [defaultTagsName.zen],
		hidden: configRaw['hidden'] || false,
		hideFromOpenapi: configRaw['hide_from_openapi'] || false,
		precondition: configRaw['precondition']
	};
};

function createAjv(): Ajv {
	const ajv = new Ajv({ strict: false, validateSchema: false });
	addFormats.default(ajv);
	return ajv;
}

export const getQueryParams = (req: HttpRequest): Record<string, unknown> => {
	const data: Record<string, unknown> = {};
	const q = req.getQuery();
	if (q) {
		q.split('&').map((r: string) => {
			const [k, v] = r.split('=');
			data[k] = v;
		});
	}
	return data;
};

export const prettyChain = (chain: string): string => {
	return chain;
};
