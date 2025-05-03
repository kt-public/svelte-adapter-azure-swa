import { build } from 'esbuild';
import { join, relative } from 'path';
import { apiFunctionDir, apiFunctionFile, apiServerDir, entry } from '../helpers/index.js';

/**
 * @typedef {import('@sveltejs/kit').Builder} Builder
 * @typedef {import('esbuild').BuildOptions} BuildOptions
 * @typedef {import('..').Options} Options
 * @typedef {import('..').StaticWebAppConfig} StaticWebAppConfig
 * @typedef {import('../helpers/index.js').BundleBuild} BundleBuild
 */

const requiredExternal = ['@azure/functions'];

/**
 *
 * @param {Builder} builder
 * @param {string} outDir
 * @param {string} tmpDir
 * @param {BundleBuild} bundleBuild
 * @param {Options} options
 */
export async function esbuildServer(builder, outDir, tmpDir, bundleBuild, options) {
	if (bundleBuild.target === 'none') {
		builder.log('ESBUILD: Skipping build');
		return;
	}
	const _apiServerDir =
		bundleBuild.target === 'output'
			? options.apiDir || join(outDir, apiServerDir)
			: relative(process.cwd(), join(tmpDir, apiServerDir));
	const _apiFunctionDir = join(_apiServerDir, apiFunctionDir);
	builder.log(`ESBUILD: Building server function to ${_apiFunctionDir}`);

	const inFile =
		bundleBuild.source === 'source'
			? entry
			: join(tmpDir, apiServerDir, apiFunctionDir, apiFunctionFile);
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
