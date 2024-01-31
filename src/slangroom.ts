import { type Slangroom as SlangroomType } from '@slangroom/core/build/esm/src/slangroom';
//@ts-ignore
import { Slangroom as SlangroomConstructor } from '@slangroom/core';
//@ts-ignore
import { wallet } from '@slangroom/wallet';
//@ts-ignore
import { http } from '@slangroom/http';

//

const SLANGROOM_PLUGINS = [wallet, http];

export class Slangroom {
	private static instance: SlangroomType;

	private constructor() {}

	public static getInstance(): SlangroomType {
		if (!Slangroom.instance) {
			Slangroom.instance = new SlangroomConstructor(SLANGROOM_PLUGINS);
		}
		return Slangroom.instance;
	}
}
