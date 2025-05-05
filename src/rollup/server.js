import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import _ from 'lodash';
import assert from 'node:assert';
import { writeFileSync } from 'node:fs';
import { join } from 'path';
import { rollup } from 'rollup';
import sourcemaps from 'rollup-plugin-sourcemaps2';
import {
	apiFunctionDir,
	apiFunctionFile,
	apiServerDir,
	entry,
	filesApi,
	getPaths
} from '../helpers/index.js';

/**
 * @typedef {import('@sveltejs/kit').Builder} Builder
 * @typedef {import('rollup').RollupOptions} RollupOptions
 * @typedef {import('..').Options} Options
 * @typedef {import('..').StaticWebAppConfig} StaticWebAppConfig
 */

const requiredExternal = ['fsevents', '@azure/functions'];

/** @returns {RollupOptions} */
function defaultRollupOptions() {
	return {
		external: requiredExternal,
		output: {
			// inlineDynamicImports: true,
			format: 'es',
			sourcemap: true
		},
		plugins: [
			sourcemaps(),
			nodeResolve({
				preferBuiltins: true,
				browser: false
			}),
			commonjs({
				strictRequires: 'auto'
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
	const _apiServerDir = options.apiDir || join(outDir, apiServerDir);
	const _apiFunctionDir = join(_apiServerDir, apiFunctionDir);

	// Generate package.json file
	if (options.apiDir === undefined) {
		// Copy all except the package.json file from the apiFiles directory
		builder.log(`Preparing package.json file for Azure Functions: ${_apiServerDir}`);
		builder.copy(join(filesApi), _apiServerDir, {
			filter: (file) => file !== 'package.json'
		});
		// Now generate package.json file
		const standardPackageJsonPath = join(filesApi, 'package.json');
		const targetPackageJsonPath = join(_apiServerDir, 'package.json');
		if (options.external === undefined) {
			// Copy the standard package.json file
			builder.log(`Copying standard package.json to ${targetPackageJsonPath}`);
			builder.copy(standardPackageJsonPath, targetPackageJsonPath);
		} else {
			// An import assertion in a dynamic import
			const packageJson = (await import(standardPackageJsonPath, { with: { type: 'json' } }))
				.default;
			/** @type {Record<string, string>} */
			const dependencies = packageJson.dependencies || {};
			const userPackageJsonPath = join(process.cwd(), 'package.json');
			const userPackageJson = (await import(userPackageJsonPath, { with: { type: 'json' } }))
				.default;
			/** @type {Record<string, string>} */
			const userDependencies = userPackageJson.dependencies || {};
			// from userDependencies, take those defined in options.external and add them to dependencies
			for (const dep of options.external) {
				if (userDependencies[dep]) {
					dependencies[dep] = userDependencies[dep];
				}
			}
			// Now write the package.json file
			builder.log(`Writing adjusted package.json to ${targetPackageJsonPath}`);
			writeFileSync(targetPackageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
		}
	}

	// Rollup the server function
	builder.log(`ROLLUP: Building server function to ${_apiFunctionDir}`);
	const rollupOptions = prepareRollupOptions(builder, outDir, tmpDir, options);
	const bundle = await rollup(rollupOptions);
	assert(!Array.isArray(rollupOptions.output), 'output should not be an array');
	await bundle.write(rollupOptions.output);
}
