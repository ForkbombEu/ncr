import LiveDirectory from 'live-directory';
import { introspect } from 'zenroom';
import { TypeCompiler } from '@sinclair/typebox/compiler';

export const content = (Z: LiveDirectory, p: string, ext: string): string => {
	return Buffer.from(Z.get(p + '.' + ext)?.content || '').toString();
};

export const getSchema = async (content: string, exclude?: string[]) => {
	const codec: Codec = await introspect(content);

	if (exclude) {
		for (const k of exclude) delete codec[k];
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

interface CodecAttr {
	encoding: 'string' | 'number';
	name: string;
	zentype: 'n' | 'y';
}

interface Codec {
	[key: string]: CodecAttr;
}

export const handleArrayBuffer = (message: ArrayBuffer | string) => {
	if (message instanceof ArrayBuffer) {
		const decoder = new TextDecoder();
		return JSON.parse(decoder.decode(message));
	}
	return JSON.parse(message);
};

export const validate = (schema: TObject, data) => {
	const C = TypeCompiler.Compile(schema);
	const isValid = C.Check(data);
	if (isValid) {
		return data;
	}
	throw new Error(
		JSON.stringify([...C.Errors(data)].map(({ path, message }) => ({ path, message })))
	);
};
