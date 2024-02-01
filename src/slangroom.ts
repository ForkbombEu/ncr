import { type Slangroom as SlangroomType } from '@slangroom/core/build/esm/src/slangroom';
//@ts-ignore
import { Slangroom } from '@slangroom/core';
//@ts-ignore
import { wallet } from '@slangroom/wallet';
//@ts-ignore
import { http } from '@slangroom/http';

//

const SLANGROOM_PLUGINS = [wallet, http];

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
