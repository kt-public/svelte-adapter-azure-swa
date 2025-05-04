import { PrerenderOption } from '@sveltejs/kit';
import { EmulateOptions } from '../index.js';

export declare function emulatePlatform(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	config: any,
	prerender: PrerenderOption,
	options?: EmulateOptions
): App.Platform;
