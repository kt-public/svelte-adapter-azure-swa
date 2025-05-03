import { writeFileSync } from 'fs';
import { join } from 'path';
import { apiFunctionDir } from '../constants.js';
import { staticClientDir } from '../rollup/client.js';

/**
 * @typedef {import('@sveltejs/kit').Builder} Builder
 * @typedef {import('rollup').RollupOptions} RollupOptions
 * @typedef {import('../index.js').Options} Options
 * @typedef {import('../index.js').StaticWebAppConfig} StaticWebAppConfig
 */

const ssrFunctionRoute = `/api/${apiFunctionDir}`;

/**
 * Validate the static web app configuration does not override the minimum config for the adapter to work correctly.
 * @param {import('../types/swa.js').CustomStaticWebAppConfig} config
 * */
function validateCustomConfig(config) {
	if ('navigationFallback' in config) {
		throw new Error('customStaticWebAppConfig cannot override navigationFallback.');
	}
	if (config.routes?.some((route) => route.route === '*')) {
		throw new Error(`customStaticWebAppConfig cannot override '*' route.`);
	}
}

/**
 * @param {import('../types/swa.js').CustomStaticWebAppConfig} customStaticWebAppConfig
 * @param {string} appDir
 * @returns {import('../types/swa.js').StaticWebAppConfig}
 */
export function generateConfig(customStaticWebAppConfig, appDir) {
	validateCustomConfig(customStaticWebAppConfig);

	customStaticWebAppConfig.routes = customStaticWebAppConfig.routes || [];

	/** @type {import('../types/swa.js').StaticWebAppConfig} */
	const swaConfig = {
		...customStaticWebAppConfig,
		routes: [
			...customStaticWebAppConfig.routes,
			{
				route: '/api/*'
			},
			{
				route: '/data-api/*'
			},
			{
				route: '*',
				methods: ['POST', 'PUT', 'DELETE'],
				rewrite: ssrFunctionRoute
			},
			{
				route: `/${appDir}/immutable/*`,
				headers: {
					'cache-control': 'public, immutable, max-age=31536000'
				}
			}
		],
		navigationFallback: {
			rewrite: ssrFunctionRoute
		},
		platform: {
			apiRuntime: 'node:20',
			...customStaticWebAppConfig.platform
		}
	};

	return swaConfig;
}

/**
 *
 * @param {Builder} builder
 * @param {string} outputDir
 * @param {string} tmpDir
 * @param {Options} options
 */
export async function buildSWAConfig(builder, outputDir, tmpDir, options) {
	const _outputDir = options.staticDir || join(outputDir, staticClientDir);
	builder.log(`Writing staticwebapp.config.json to ${_outputDir}`);

	let swaConfig = options.customStaticWebAppConfig || {};
	swaConfig = generateConfig(swaConfig, builder.config.kit.appDir);

	if (!builder.prerendered.paths.includes('/')) {
		// Azure SWA requires an index.html to be present
		// If the root was not pre-rendered, add a placeholder index.html
		// Route all requests for the index to the SSR function
		writeFileSync(`${_outputDir}/index.html`, '');
		swaConfig.routes.push(
			{
				route: '/index.html',
				rewrite: ssrFunctionRoute
			},
			{
				route: '/',
				rewrite: ssrFunctionRoute
			}
		);
	}

	writeFileSync(`${outputDir}/staticwebapp.config.json`, JSON.stringify(swaConfig, null, 2));
}
