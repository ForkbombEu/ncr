// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Type as T, Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import fs from 'fs-extra';
import _ from 'lodash';

//

import { config } from './cli.js';
const L = config.logger;

//

export async function readFileContent(
	path: string,
	encoding: BufferEncoding = 'utf-8'
): Promise<string | undefined> {
	try {
		return (await fs.readFile(path)).toString(encoding);
	} catch {
		return undefined;
	}
}

export async function renameFile(oldPath: string, newPath: string) {
	try {
		await fs.move(oldPath, newPath);
	} catch (e) {
		L.error(e);
	}
}

export async function writeFile(path: string, content: string) {
	try {
		await fs.writeFile(path, content);
	} catch (e) {
		L.error(e);
	}
}

/* Contracts file handling */

export function formatContract(baseContract: string): string {
	return `Rule check version ${config.zenroomVersion}\n${baseContract}`;
}

/* Json files handling */

const jsonObjectSchema = T.Record(T.String(), T.Unknown());

export type JsonObjectType = Static<typeof jsonObjectSchema>;

export function isJsonObject(data: unknown): data is JsonObjectType {
	return Value.Check(jsonObjectSchema, data);
}

export async function readJsonObject(path: string): Promise<JsonObjectType | undefined> {
	try {
		const content = await readFileContent(path);
		if (!content) return undefined;
		const parsedContent = JSON.parse(content);
		if (isJsonObject(parsedContent)) return parsedContent;
		else return undefined;
	} catch (e) {
		L.error(e);
		return undefined;
	}
}

export async function updateJsonObjectFile(filePath: string, newContent: JsonObjectType) {
	try {
		const oldContent = await readJsonObject(filePath);
		if (isJsonObject(oldContent)) {
			const mergedContent = _.merge(oldContent, newContent);
			writeFile(filePath, JSON.stringify(mergedContent, null, 4));
		} else {
			writeFile(filePath, JSON.stringify(newContent, null, 4));
		}
	} catch (e) {
		L.error(e);
	}
}
