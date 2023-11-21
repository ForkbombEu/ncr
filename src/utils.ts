import { introspect } from 'zenroom';
import { Type } from '@sinclair/typebox';
import { Codec, Endpoints, JSONSchema } from './types';
import _ from 'lodash';
import Ajv, { type ValidateFunction } from 'ajv';
import { config } from './cli.js';

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
			number: Type.Number()
		};
		const schema = Type.Object(
			Object.fromEntries(
				Object.values(codec).map(({ name, encoding }) => [name, encodingToType[encoding]])
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
	const ajv = new Ajv({
		strict: false
	});
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
		const ajv = new Ajv({ strict: false });
		ajv.compile(schema);
	} catch (e) {
		throw e;
	}
}
