import { introspect } from 'zenroom';
import { Type } from '@sinclair/typebox';
import { Codec, Endpoints, JSONSchema, Metadata } from './types';
import _ from 'lodash';
import Ajv, { type ValidateFunction } from 'ajv';
import { config } from './cli.js';
import addFormats from 'ajv-formats';

const L = config.logger;

//

export async function getSchema(endpoints: Endpoints): Promise<JSONSchema | undefined> {
	const { contract, keys } = endpoints;
	try {
		const schema = endpoints.schema ?? (await getSchemaFromIntrospection(contract));
		if (!keys) return schema;
		else if (schema) return removeKeysFromSchema(schema, keys);
	} catch (e) {
		console.error(e);
	}
}

export async function getSchemaFromIntrospection(
	contract: string
): Promise<JSONSchema | undefined> {
	try {
		const codec: Codec = await introspect(contract);
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
	} catch (e) {
		L.error(e);
	}
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
	const validate = ajv.compile(schema);
	if (!validate(data))
		throw new Error(`Invalid data provided:\n${formatAjvErrors(validate.errors)}`);
	return data;
};

export function formatAjvErrors(ajvErrors: ValidateFunction['errors']): string {
	if (!ajvErrors) return '';
	return JSON.stringify(ajvErrors, null, 2);
}

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
	try {
		const ajv = createAjv();
		ajv.compile(schema);
	} catch (e) {
		throw e;
	}
}

/*
 * The JSON in input and Metadata use a different convention:
 * - JSON is snake case
 * - Metadata is camel case
 * The reason is that Metadata uses the convention of javascript,
 * while the input JSON the one from zenroom
 */
export const newMetadata = (configRaw: JSON): Metadata => {
	return {
		httpHeaders: configRaw['http_headers'] || false
	};
};

function createAjv(): Ajv {
	const ajv = new Ajv({ strict: false, validateSchema: false });
	addFormats.default(ajv);
	return ajv;
}
