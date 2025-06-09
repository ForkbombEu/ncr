// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Slangroom } from '@slangroom/core';
import { type Slangroom as SlangroomType } from '@slangroom/core/build/esm/src/slangroom';
import { db } from '@slangroom/db';
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

const SLANGROOM_PLUGINS = [
	db,
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
