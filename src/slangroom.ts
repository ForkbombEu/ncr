// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Slangroom, type Slangroom as SlangroomType } from '@slangroom/core';
import { db } from '@slangroom/db';
import { did } from '@slangroom/did';
import { ethereum } from '@slangroom/ethereum';
import { fs } from '@slangroom/fs';
import { git } from '@slangroom/git';
import { helpers } from '@slangroom/helpers';
import { http } from '@slangroom/http';
import { JSONSchema } from '@slangroom/json-schema';
import { oauth } from '@slangroom/oauth';
import { pocketbase } from '@slangroom/pocketbase';
import { qrcode } from '@slangroom/qrcode';
import { redis } from '@slangroom/redis';
import { shell } from '@slangroom/shell';
import { timestamp } from '@slangroom/timestamp';
import { wallet } from '@slangroom/wallet';
import { zencode } from '@slangroom/zencode';
import { execute } from '@dyne/slangroom-chain';
import { JSONObject } from './types.js';

const SLANGROOM_PLUGINS = [
	db,
	did,
	ethereum,
	fs,
	git,
	helpers,
	http,
	JSONSchema,
	oauth,
	pocketbase,
	qrcode,
	redis,
	shell,
	timestamp,
	wallet,
	zencode
];

export class SlangroomManager {
	private static instance: SlangroomType;

	private constructor() {}

	public static getInstance(): SlangroomType {
		if (!SlangroomManager.instance) {
			SlangroomManager.instance = new Slangroom(SLANGROOM_PLUGINS);
		}
		return SlangroomManager.instance;
	}
}

export async function slangroomChainExecute(
	chain: string,
	chainExt: string,
	data?: JSONObject,
	keys?: JSONObject
) {
	const dataFormatted = data ? JSON.stringify(data) : undefined;
	const keysFormatted = keys ? JSON.stringify(keys) : undefined;
	const parsedChain = chainExt === '.js' ? eval(chain)() : chain;
	const slangRes = await execute(parsedChain, dataFormatted, keysFormatted);
	return JSON.parse(slangRes);
}
