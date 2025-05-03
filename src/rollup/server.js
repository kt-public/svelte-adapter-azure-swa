import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import _ from 'lodash';
import { join, relative } from 'path';
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
 * @typedef {import('../helpers/index.js').BundleBuild} BundleBuild
 */

const requiredExternal = [
	'@azure/functions'
	// Rollup is not able to resolve these dependencies
	// '@sentry/sveltekit'
	// /^@babel\/.*/
];

/** @returns {RollupOptions} */
function defaultRollupOptions() {
	return {
		external: requiredExternal,
		output: {
			inlineDynamicImports: true,
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
			// babel({ babelHelpers: 'bundled' })
		]
	};
}

/**
 *
 * @param {Builder} builder
 * @param {string} outDir
 * @param {string} tmpDir
 * @param {BundleBuild} bundleBuild
 * @param {Options} options
 * @returns {RollupOptions}
 */
function prepareRollupOptions(builder, outDir, tmpDir, bundleBuild, options) {
	if (bundleBuild.target === 'none') {
		throw new Error("ROLLUP: Bundle target 'none' cannot be used here");
	}
	const _apiServerDir =
		bundleBuild.target === 'output'
			? options.apiDir || join(outDir, apiServerDir)
			: join(tmpDir, apiServerDir);

	const inFile =
		bundleBuild.source === 'source'
			? entry
			: join(tmpDir, apiServerDir, apiFunctionDir, apiFunctionFile);
	const outFile = join(_apiServerDir, apiFunctionDir, apiFunctionFile);
	const { serverFile, manifestFile, envFile } = getPaths(builder, tmpDir);

	/** @type RollupOptions */
	let _options = {
		input: inFile,
		output: {
			file: outFile
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
			if (warning.code === 'THIS_IS_UNDEFINED') {
				// Ignore 'this is undefined' warning
				return;
			}
			if (warning.plugin === 'sourcemaps' && warning.code === 'PLUGIN_WARNING') {
				// Ignore rollup-plugin-sourcemaps warnings
				return;
			}
			if (warning.code === 'SOURCEMAP_ERROR') {
				// Ignore sourcemap errors
				return;
			}
			if (warning.code === 'CIRCULAR_DEPENDENCY') {
				// Ignore circular dependency warnings
				return;
			}
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
 * @param {BundleBuild} bundleBuild
 * @param {Options} options
 */
export async function rollupServer(builder, outDir, tmpDir, bundleBuild, options) {
	if (bundleBuild.target === 'none') {
		builder.log('ROLLUP: Skipping build');
		return;
	}
	const _apiServerDir =
		bundleBuild.target === 'output'
			? options.apiDir || join(outDir, apiServerDir)
			: relative(process.cwd(), join(tmpDir, apiServerDir));
	const _apiFunctionDir = join(_apiServerDir, apiFunctionDir);
	builder.log(`ROLLUP: Building server function to ${_apiFunctionDir}`);

	const rollupOptions = prepareRollupOptions(builder, outDir, tmpDir, bundleBuild, options);

	const bundle = await rollup(rollupOptions);
	if (Array.isArray(rollupOptions.output)) {
		for (const output of rollupOptions.output) {
			await bundle.write(output);
		}
	} else {
		await bundle.write(rollupOptions.output);
	}
	builder.log.warn("Rollup cannot resolve '@sentry/sveltekit' dependency for the Azure Function.");
	builder.log.warn("It will be bundled with the following 'esbuild' step.");
	builder.log.warn('Rollup warnings are not fatal.');
}
