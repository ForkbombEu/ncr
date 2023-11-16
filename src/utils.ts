import { introspect } from 'zenroom';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { Codec, JSONObject } from './types';

export const getSchema = async (content: string, keys?: JSONObject) => {
	const codec: Codec = await introspect(content);

	if (keys) {
		for (const k of Object.keys(keys)) delete codec[k];
	}
	const schema: any = {
		type: 'object',
		properties: {},
		required: [],
		additionalProperties: false
	};

	Object.values(codec).map((a) => {
		switch (a.encoding) {
			case 'string':
				schema.properties[a.name] = { type: 'string' };
				schema.required.push(a.name);
				break;
			case 'number':
				schema.properties[a.name] = { type: 'number' };
				schema.required.push(a.name);
			default:
				break;
		}
	});
	return schema;
};

export const handleArrayBuffer = (message: ArrayBuffer | string) => {
	if (message instanceof ArrayBuffer) {
		const decoder = new TextDecoder();
		return JSON.parse(decoder.decode(message));
	}
	return JSON.parse(message);
};

export const validate = (schema: any, data) => {
	const C = TypeCompiler.Compile(schema);
	const isValid = C.Check(data);
	if (isValid) {
		return data;
	}
	throw new Error(
		JSON.stringify([...C.Errors(data)].map(({ path, message }) => ({ path, message })))
	);
};
