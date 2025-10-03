// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { join, parse } from 'node:path';

//

export const FILE_EXTENSIONS = {
	config: '.conf',
	contract: ['.zen'],
	chain: ['.js', '.yaml', '.yml'],
	chainQualifiers: ['.chain'],
	json: ['.json'],
	jsonQualifiers: ['.data', '.keys', '.schema', '.metadata']
};

//

function hasQualifier(filePath: string, baseExts: string[], qualifiers: string[]): boolean {
	const { name, ext } = parse(filePath);
	return baseExts.includes(ext) && qualifiers.includes(parse(name).ext);
}

//

export function isContractFile(filePath: string): boolean {
	return FILE_EXTENSIONS.contract.includes(parse(filePath).ext);
}

export function isChainFile(filePath: string): boolean {
	return hasQualifier(filePath, FILE_EXTENSIONS.chain, FILE_EXTENSIONS.chainQualifiers);
}

export function isConfigFile(filePath: string): boolean {
	return FILE_EXTENSIONS.config === parse(filePath).ext;
}

export function isZencodeCompanionFile(filePath: string): boolean {
	return hasQualifier(filePath, FILE_EXTENSIONS.json, FILE_EXTENSIONS.jsonQualifiers);
}

//

export function getContractPath(filePath: string): string {
	const { dir, name } = parse(filePath);
	return join(dir, name);
}

export function getChainPath(filePath: string): string {
	const { dir, name } = parse(filePath);
	return join(dir, parse(name).name);
}

export function getBasePath(filePath: string): string {
	let { dir, name, ext } = parse(filePath);
	while (ext) {
		const parsed = parse(name);
		name = parsed.name;
		ext = parsed.ext;
	}
	return dir ? join(dir, name) : name;
}
