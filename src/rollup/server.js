import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import _ from 'lodash';
import assert from 'node:assert';
import { join } from 'path';
import { rollup } from 'rollup';
import sourcemaps from 'rollup-plugin-sourcemaps2';
import {
	apiFunctionDir,
	apiFunctionFile,
	apiServerDir,
	entry,
	getPaths
} from '../helpers/index.js';

/**
 * @typedef {import('@sveltejs/kit').Builder} Builder
 * @typedef {import('rollup').RollupOptions} RollupOptions
 * @typedef {import('..').Options} Options
 * @typedef {import('..').StaticWebAppConfig} StaticWebAppConfig
 */

const requiredExternal = [
	'@azure/functions',
	'@babel/preset-typescript',
	'@babel/preset-typescript/package.json'
];

/** @returns {RollupOptions} */
function defaultRollupOptions() {
	return {
		external: requiredExternal,
		output: {
			// inlineDynamicImports: true,
			format: 'cjs',
			sourcemap: true
		},
		plugins: [
			sourcemaps(),
			nodeResolve({
				preferBuiltins: true,
				browser: false
			}),
			commonjs({
				strictRequires: true
			}),
			json()
		]
	};
}

/**
 *
 * @param {Builder} builder
 * @param {string} outDir
 * @param {string} tmpDir
 * @param {Options} options
 * @returns {RollupOptions}
 */
function prepareRollupOptions(builder, outDir, tmpDir, options) {
	const _apiServerDir = options.apiDir || join(outDir, apiServerDir);

	const inFile = entry;
	const _apiFunctionDir = join(_apiServerDir, apiFunctionDir);
	// const outFile = join(_apiServerDir, apiFunctionDir, apiFunctionFile);
	const { serverFile, manifestFile, envFile } = getPaths(builder, tmpDir);

	const ignoreWarnCodes = new Set(['THIS_IS_UNDEFINED', 'CIRCULAR_DEPENDENCY', 'SOURCEMAP_ERROR']);

	/** @type RollupOptions */
	let _options = {
		input: inFile,
		output: {
			dir: _apiFunctionDir,
			entryFileNames: apiFunctionFile
		},
		plugins: [
			alias({
				entries: [
					{
						find: 'ENV',
						replacement: envFile
					},
					{
						find: 'MANIFEST',
						replacement: manifestFile
					},
					{
						find: 'SERVER',
						replacement: serverFile
					},
					{
						find: '@sentry/sveltekit',
						replacement: join(
							process.cwd(),
							'node_modules',
							'@sentry',
							'sveltekit',
							'build',
							'esm',
							'index.server.js'
						)
					}
				]
			})
		],
		onwarn(warning, handler) {
			if (
				ignoreWarnCodes.has(warning.code) ||
				(warning.plugin === 'sourcemaps' && warning.code === 'PLUGIN_WARNING')
			)
				return;
			handler(warning);
		}
	};
	_options = _.mergeWith(defaultRollupOptions(), _options, (objValue, srcValue) => {
		if (Array.isArray(objValue) && Array.isArray(srcValue)) {
			return objValue.concat(srcValue);
		}
	});

	/** @type {any} */
	let external = _options.external;
	external = [...(external || []), ...(options.external || [])];
	_options.external = external;

	return _options;
}

/**
 *
 * @param {Builder} builder
 * @param {string} outDir
 * @param {string} tmpDir
 * @param {Options} options
 */
export async function rollupServer(builder, outDir, tmpDir, options) {
	const _apiServerDir = options.apiDir || join(outDir, apiServerDir);
	const _apiFunctionDir = join(_apiServerDir, apiFunctionDir);
	builder.log(`ROLLUP: Building server function to ${_apiFunctionDir}`);

	const rollupOptions = prepareRollupOptions(builder, outDir, tmpDir, options);

	const bundle = await rollup(rollupOptions);
	assert(!Array.isArray(rollupOptions.output), 'output should not be an array');
	await bundle.write(rollupOptions.output);
}
