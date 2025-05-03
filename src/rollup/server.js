import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { writeFileSync } from 'fs';
import _ from 'lodash';
import { join, posix } from 'path';
import { rollup } from 'rollup';
import sourcemaps from 'rollup-plugin-sourcemaps2';
import { fileURLToPath } from 'url';
import { apiFunctionDir, apiFunctionFile, apiServerDir } from '../constants.js';

/**
 * @typedef {import('@sveltejs/kit').Builder} Builder
 * @typedef {import('rollup').RollupOptions} RollupOptions
 * @typedef {import('..').Options} Options
 */

const requiredExternal = [
	'@azure/functions'
	// Rollup is not able to resolve these dependencies
	// '@sentry/sveltekit'
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
			})
		]
	};
}

const files = fileURLToPath(new URL('../files', import.meta.url));
const entry = fileURLToPath(new URL('../entry/index.js', import.meta.url));

/**
 *
 * @param {Builder} builder
 * @param {string} outDir
 * @param {string} tmpDir
 * @returns {{
 *   serverPath: string,
 *   serverFile: string,
 *   serverRelativePath: string,
 *   manifestFile: string,
 *   envFile: string
 * }}
 */
function getPaths(builder, outDir, tmpDir) {
	// use posix because of https://github.com/sveltejs/kit/pull/3200
	const serverPath = builder.getServerDirectory();
	const serverFile = join(serverPath, 'index.js');
	const serverRelativePath = posix.relative(tmpDir, builder.getServerDirectory());
	const manifestFile = join(tmpDir, 'manifest.js');
	const envFile = join(tmpDir, 'env.js');
	return {
		serverPath,
		serverFile,
		serverRelativePath,
		manifestFile,
		envFile
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
	const _apiServerDir = join(tmpDir, apiServerDir); // Intermediate location
	// const _apiServerDir = options.apiDir || join(outDir, apiServerDir); // Output location
	const outFile = join(_apiServerDir, apiFunctionDir, apiFunctionFile);
	const { serverFile, manifestFile, envFile } = getPaths(builder, outDir, tmpDir);

	/** @type RollupOptions */
	let _options = {
		input: entry,
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
					}
				]
			})
		]
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
	// const _apiServerDir = options.apiDir || join(outDir, apiServerDir); // Output location
	const _apiServerDir = join(tmpDir, apiServerDir); // Intermediate location
	const _apiFunctionDir = join(_apiServerDir, apiFunctionDir);
	builder.log(`ROLLUP: Building server function to ${_apiFunctionDir}`);

	const { serverRelativePath, manifestFile, envFile } = getPaths(builder, outDir, tmpDir);
	const debug = options.debug || false;

	builder.copy(files, tmpDir);

	const rollupOptions = prepareRollupOptions(builder, outDir, tmpDir, options);

	if (options.apiDir === undefined) {
		/** @type any */
		const output = rollupOptions.output;
		builder.log(`Using standard output location for Azure Functions: ${output.file}`);
		builder.copy(join(files, 'api'), _apiServerDir);
	}

	// Write manifest
	writeFileSync(
		manifestFile,
		`export const manifest = ${builder.generateManifest({
			relativePath: serverRelativePath
		})};\n`
	);
	// Write environment
	writeFileSync(envFile, `export const debug = ${debug.toString()};\n`);

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
