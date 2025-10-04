// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { join, parse } from 'node:path';
import fs from 'fs-extra';
import { Type as T, Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import {
	formatContract,
	readFileContent,
	readJsonObject,
	updateJsonObjectFile
} from './fileUtils.js';
import { getChainPath, getContractPath, isChainFile, isContractFile } from './pathUtils.js';
import { slangroomChainExecute, SlangroomManager } from './slangroom.js';

import { config } from './cli.js';
import { JSONObject } from './types.js';
const L = config.logger;

/* Main */

const AUTORUN_CONTRACTS_PATH = join(config.zencodeDirectory, '.autorun');

export async function autorunContracts() {
	const contracts = await loadContractsData(AUTORUN_CONTRACTS_PATH);
	await autorunInstallContracts(contracts);
	await autorunStartupContracts(contracts);
}
export async function autorunStartupContracts(contracts: ContractData[]) {
	const startupContracts = contracts.filter(isStartupContract);
	const contractsPromises = startupContracts.map(runContractData);
	await Promise.allSettled(contractsPromises);
}

export async function autorunInstallContracts(contracts: ContractData[]) {
	const installContracts = contracts.filter(isInstallContract);
	const installContractsToRun = installContracts.filter(isInstallContractNotExecuted);
	const contractsPromises = installContractsToRun.map(runInstallContractData);
	await Promise.allSettled(contractsPromises);
}

/* Definitions */

async function getContractPathsInDirectory(directoryPath: string): Promise<string[]> {
	try {
		const directory = await fs.readdir(directoryPath);
		return Array.from(directory.entries())
			.map((entry) => entry[1])
			.filter((name) => isContractFile(name) || isChainFile(name))
			.map((name) => join(directoryPath, name));
	} catch {
		return [];
	}
}

async function loadContractsData(directoryPath: string): Promise<ContractData[]> {
	const contractPaths = await getContractPathsInDirectory(directoryPath);
	const contractDataPromises = contractPaths.map(loadContractData);
	const maybeContractData = await Promise.all(contractDataPromises);
	return maybeContractData.filter((d) => Boolean(d)) as ContractData[];
}

async function runContractData({ contract, keys, conf, data, path }: ContractData) {
	try {
		let result;
		if (isContractFile(path)) {
			const s = SlangroomManager.getInstance();
			({ result } = await s.execute(contract, { keys, data, conf }));
		} else {
			result = await slangroomChainExecute(contract, parse(path).ext, data, keys);
		}
		L.info(`Running autorun contract ${path}`);
		L.info(result);
	} catch (e) {
		L.error(e);
	}
}

async function runInstallContractData(contractData: InstallContractData) {
	try {
		await runContractData(contractData);
		await decommissionInstallContract(contractData);
	} catch (e) {
		L.error(e);
	}
}

//

export interface ContractData {
	path: string;
	contract: string;
	keys?: JSONObject | undefined;
	data?: JSONObject | undefined;
	metadata?: Record<string, unknown> | undefined;
	conf?: string | undefined;
}

async function loadContractData(contractPath: string): Promise<ContractData | undefined> {
	try {
		const contract = await readContract(contractPath);
		if (!contract) throw new Error('Contract not found');

		let basePath;
		if (isContractFile(contractPath)) basePath = getContractPath(contractPath);
		else basePath = getChainPath(contractPath);

		const keysPath = `${basePath}.keys.json`;
		const keys = (await readJsonObject(keysPath)) as JSONObject;

		const dataPath = `${basePath}.data.json`;
		const data = (await readJsonObject(dataPath)) as JSONObject;

		const metadataPath = `${basePath}.metadata.json`;
		const metadata = await readJsonObject(metadataPath);

		const confPath = `${basePath}.conf`;
		const conf = await readFileContent(confPath);

		return {
			path: contractPath,
			contract,
			keys,
			conf,
			data,
			metadata
		};
	} catch (e) {
		L.error(e);
		return undefined;
	}
}

//

async function readContract(path: string): Promise<string | undefined> {
	const contract = await readFileContent(path);
	return contract;
	// return contract ? formatContract(contract) : undefined;
}

/* Autorun checks */

const autorunStartupContractMetadataSchema = T.Object({
	autorun: T.Literal('startup')
});

function isStartupContract(contractData: ContractData): boolean {
	if (!contractData.metadata) return false;
	return Value.Check(autorunStartupContractMetadataSchema, contractData.metadata);
}

//

const installContractMetadataSchema = T.Object({
	autorun: T.Literal('install'),
	executed: T.Optional(T.Boolean())
});

interface InstallContractData extends ContractData {
	metadata: Static<typeof installContractMetadataSchema>;
}

function isInstallContract(contractData: ContractData): contractData is InstallContractData {
	const { metadata } = contractData;
	return Value.Check(installContractMetadataSchema, metadata);
}

function isInstallContractNotExecuted(contractData: InstallContractData): boolean {
	return !contractData.metadata.executed;
}

async function decommissionInstallContract(contractData: InstallContractData) {
	let basePath;
	if (isContractFile(contractData.path)) basePath = getContractPath(contractData.path);
	else basePath = getChainPath(contractData.path);
	const oldMetadata = contractData.metadata;
	const metadataPath = `${basePath}.metadata.json`;
	await updateJsonObjectFile(metadataPath, { ...oldMetadata, executed: true });
}
