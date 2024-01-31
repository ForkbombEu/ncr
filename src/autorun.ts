import { config } from './cli.js';
import { join, parse } from 'node:path';
import fs from 'fs-extra';
import { Type as T, Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

//@ts-ignore
import { Slangroom } from '@slangroom/core';
//@ts-ignore
import { wallet } from '@slangroom/wallet';
//@ts-ignore
import { http } from '@slangroom/http';

/* Main */

export async function autorunContracts() {
	await autorunContractsRecurring();
	await autorunContractsOnce();
}

/* Constants */

const AUTORUN_RECURRING_PATH = join(config.zencodeDirectory, '.autorun');
const AUTORUN_ONCE_PATH = join(AUTORUN_RECURRING_PATH, 'once');

const NO_RUN_PREFIX = '_@done';

const L = config.logger;

/* */

export async function autorunContractsRecurring() {
	const contracts = await loadContractsData(AUTORUN_RECURRING_PATH);
	const contractsPromises = contracts.map((c) => runContractData(c));
	await Promise.all(contractsPromises);
}

export async function autorunContractsOnce() {
	const contracts = await loadContractsData(AUTORUN_ONCE_PATH);
	const contractsToRun = contracts.filter((c) => !c.path.includes(NO_RUN_PREFIX));
	const contractsPromises = contractsToRun.map((c) => runContractData(c));
	await Promise.all(contractsPromises);
	const decommissionContractPromises = contractsToRun.map((c) => decommissionContract(c.path));
	await Promise.all(decommissionContractPromises);
}

//

async function getContractPathsInDirectory(directoryPath: string): Promise<string[]> {
	const directory = await fs.readdir(directoryPath);
	return Array.from(directory.entries())
		.map((entry) => entry[1])
		.filter((name) => isZencodeFile(name))
		.map((name) => join(directoryPath, name));
}

async function loadContractsData(directoryPath: string): Promise<ContractData[]> {
	const contractPaths = await getContractPathsInDirectory(directoryPath);
	const contractDataPromises = contractPaths.map(loadContractData);
	const maybeContractData = await Promise.all(contractDataPromises);
	return maybeContractData.filter((d) => Boolean(d)) as ContractData[];
}

async function runContractData({ contract, keys, conf, data, path }: ContractData) {
	try {
		const s = new Slangroom([http, wallet]);
		const { result } = await s.execute(contract, { keys, data, conf });
		L.info('Run contract');
		L.info(path);
		L.info(result);
	} catch (e) {
		L.error(e);
	}
}

async function decommissionContract(contractPath: string) {
	const { dir, name, ext } = parse(contractPath);
	renameFile(contractPath, join(dir, `${name}${NO_RUN_PREFIX}${ext}`));
}

//

export interface ContractData {
	path: string;
	contract: string;
	keys?: Record<string, unknown> | undefined;
	data?: Record<string, unknown> | undefined;
	metadata?: Record<string, unknown> | undefined;
	conf?: string | undefined;
}

async function loadContractData(contractPath: string): Promise<ContractData | undefined> {
	try {
		const contract = await readContract(contractPath);
		if (!contract) throw new Error('Contract not found');

		const { base: contractName, dir: directoryPath } = parse(contractPath);

		const keysPath = join(directoryPath, `${contractName}.keys.json`);
		const keys = await readJson(keysPath);

		const dataPath = join(directoryPath, `${contractName}.data.json`);
		const data = await readJson(dataPath);

		const metadataPath = join(directoryPath, `${contractName}.metadata.json`);
		const metadata = await readJson(metadataPath);

		const confPath = join(directoryPath, `${contractName}.conf`);
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
	return contract ? formatContract(contract) : undefined;
}

function formatContract(baseContract: string): string {
	return `Rule unknown ignore\nRule check version ${config.zenroomVersion}\n${baseContract}`;
}

async function readJson(path: string): Promise<any> {
	const content = await readFileContent(path);
	return content ? JSON.parse(content) : undefined;
}

async function readFileContent(
	path: string,
	encoding: BufferEncoding = 'utf-8'
): Promise<string | undefined> {
	try {
		return (await fs.readFile(path)).toString(encoding);
	} catch (e) {
		return undefined;
	}
}

async function renameFile(oldPath: string, newPath: string) {
	await fs.move(oldPath, newPath);
}

function isZencodeFile(filePath: string): boolean {
	return parse(filePath).ext === '.zen';
}
