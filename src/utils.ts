import { introspect } from 'zenroom';
import { Type } from '@sinclair/typebox';
import { Codec, Endpoints } from './types';
import _ from 'lodash';
import Ajv, { type ValidateFunction } from 'ajv';

//

export const getSchema = async (endpoints: Endpoints) => {
  try {
    const { contract, keys } = endpoints;
    if (endpoints.schema) return endpoints.schema;
    const codec: Codec = await introspect(contract);

    if (keys) {
      for (const k of Object.keys(keys)) delete codec[k];
    }
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
    console.error(e)
  }
};

export const validateData = (
	schema: Awaited<ReturnType<typeof getSchema>>,
	data: JSON | Record<string, unknown>
) => {
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
