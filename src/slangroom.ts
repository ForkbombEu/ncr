import { type Slangroom as SlangroomType } from '@slangroom/core/build/esm/src/slangroom';
//@ts-ignore
import { Slangroom } from '@slangroom/core';
//@ts-ignore
import { wallet } from '@slangroom/wallet';
//@ts-ignore
import { http } from '@slangroom/http';
//@ts-ignore
import { fs } from '@slangroom/fs';
//@ts-ignore
import { zencode } from '@slangroom/zencode';
//@ts-ignore
import { git } from '@slangroom/git';
//@ts-ignore
import { oauth } from '@slangroom/oauth';

//

const SLANGROOM_PLUGINS = [zencode, fs, wallet, http, git, oauth];

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
