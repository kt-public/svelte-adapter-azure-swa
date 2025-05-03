import { build } from 'esbuild';
import { join } from 'path';
import { apiFunctionDir, apiFunctionFile, apiServerDir } from '../constants.js';

/**
 * @typedef {import('@sveltejs/kit').Builder} Builder
 * @typedef {import('esbuild').BuildOptions} BuildOptions
 * @typedef {import('..').Options} Options
 * @typedef {import('..').StaticWebAppConfig} StaticWebAppConfig
 */

const requiredExternal = ['@azure/functions'];

/**
 *
 * @param {Builder} builder
 * @param {string} outDir
 * @param {string} tmpDir
 * @param {Options} options
 */
export async function esbuildServer(builder, outDir, tmpDir, options) {
	const _apiServerDir = options.apiDir || join(outDir, apiServerDir);
	const _apiFunctionDir = join(_apiServerDir, apiFunctionDir);
	builder.log(`ESBUILD: Re-Building server function to ${_apiFunctionDir}`);

	const inFile = join(tmpDir, apiServerDir, apiFunctionDir, apiFunctionFile);
	const outFile = join(_apiFunctionDir, apiFunctionFile);

	const apiRuntime = options.customStaticWebAppConfig?.platform?.apiRuntime;
	const target = apiRuntime?.replace(':', '') || 'node20';
	let external = [...requiredExternal, ...(options.external || [])];
	/** @type {BuildOptions} */
	const _options = {
		entryPoints: [inFile],
		outfile: outFile,
		format: 'cjs',
		bundle: true,
		platform: 'node',
		target: target,
		external: external,
		sourcemap: true
	};
	await build(_options);
}
