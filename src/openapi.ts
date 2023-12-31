import { OpenAPIV3_1 } from 'openapi-types';
import { Type } from '@sinclair/typebox';
import { getSchema } from './utils.js';
import { Endpoints, JSONSchema } from './types.js';

export function generateRawPath(): OpenAPIV3_1.PathItemObject {
	return {
		get: {
			tags: ['📜 Raw contracts'],
			responses: {
				'200': {
					description: 'Succesful response will output the zencode verbatim contract',
					content: { 'text/plain': { schema: Type.String() } }
				}
			}
		}
	};
}

export function generateAppletPath(): OpenAPIV3_1.PathItemObject {
	return {
		get: {
			tags: ['📱 Generated applets'],
			responses: {
				'200': {
					description: 'Generated applet on the fly based on the contract introspection',
					content: { 'text/html': { schema: Type.String() } }
				}
			}
		}
	};
}

export function generatePath(contract: string, schema: JSONSchema): OpenAPIV3_1.PathItemObject {
	const getParams = schema.required?.map((n: string) => {
		return {
			name: n,
			in: 'query',
			description: `The ${n}`,
			required: true,
			schema: { type: 'string' }
		};
	});

	return {
		post: {
			description: contract.replaceAll('\n', '\n\n'),
			tags: ['📑 Endpoints'],
			requestBody: {
				content: {
					'application/json': { schema }
				}
			},
			responses: {
				'200': {
					description: 'The zencode execution output, splitted by newline',
					content: {
						'application/json': {
							schema: Type.Object({
								output: Type.Array(Type.String())
							})
						}
					}
				},
				'500': {
					description: 'Zenroom execution error',
					content: { 'application/json': { schema: Type.Array(Type.String()) } }
				}
			}
		},
		get: {
			description: contract.replaceAll('\n', '\n\n'),
			tags: ['📑 Endpoints'],
			parameters: getParams,
			responses: {
				'200': {
					description: 'The zencode execution output, splitted by newline',
					content: {
						'application/json': {
							schema: Type.Object({
								output: Type.Array(Type.String())
							})
						}
					}
				},
				'500': {
					description: 'Zenroom execution error',
					content: { 'application/json': { schema: Type.Array(Type.String()) } }
				}
			}
		}
	};
}

export const definition: Partial<OpenAPIV3_1.Document> = {
	openapi: '3.1.0',
	paths: {},
	info: {
		title: 'noˑcodeˑroom',
		version: '1.0.0',
		description: `## Create Restful api from zencode smart contracts with no code!

This is a simple API autogenerated from a folder within your server.

To add new endpoints you should add new zencode contracts in the directory.

**NB** The files should be in form of \`endpoint.zen\` then your contract will run on \`/endpoint\``,
		termsOfService: 'https://forkbomb.solutions/privacy-policy/',
		contact: {
			email: 'info@forkbomb.eu',
			name: 'Forkbomb BV',
			url: 'https://forkbomb.solutions'
		},
		license: {
			name: 'GNU Affero General Public License v3.0 or later',
			url: 'https://www.gnu.org/licenses/agpl-3.0'
		}
	},
	tags: [
		{
			name: '📑 Endpoints',
			description: 'The endpoints of your API generated over the zencode smart contracts'
		},
		{
			name: '📱 Generated applets',
			description: 'The generated UI app of your contracts introspection'
		},
		{
			name: '📜 Raw contracts',
			description: 'Sometimes you just need to see the contract you are executing'
		}
	]
};

export const openapiTemplate = `
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta name="description" content="SwaggerUI" />
		<title>noˑcodeˑroom documentation</title>
		<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.4/swagger-ui.css" />
		<style>
			.swagger-ui h1:before {
				content: '# ';
			}
			.swagger-ui h1 {
				font-size: 14px;
				margin: 0 0;
				font-style: italic;
				color: #888;
				font-weight: 100;
			}
			.swagger-ui .renderedMarkdown p {
				margin: 10px 0px;
				font-weight: 600;
			}
		</style>
	</head>
	<body>
		<div id="swagger-ui"></div>
		<script src="https://unpkg.com/swagger-ui-dist@5.9.4/swagger-ui-bundle.js" crossorigin></script>
		<script>
			window.onload = () => {
				window.ui = SwaggerUIBundle({
					url: '/oas.json',
					dom_id: '#swagger-ui'
				});
			};
		</script>
	</body>
</html>
`;
