import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { join } from 'path';
import adapterSWA from 'svelte-adapter-azure-swa';

const [major] = process.versions.node.split('.').map(Number);
let NODE_API_RUNTIME = (process.env.NODE_API_RUNTIME || '').trim();
console.warn('#'.repeat(100));
if (
	NODE_API_RUNTIME.length === 0 ||
	!NODE_API_RUNTIME.startsWith('node:') ||
	NODE_API_RUNTIME.split(':')[1] === ''
) {
	console.warn(
		`NODE_API_RUNTIME is not set or not set properly ('${NODE_API_RUNTIME}'). Defaulting to Node.js node:${major} runtime.`
	);
	NODE_API_RUNTIME = `node:${major}`;
}
console.warn(`Using API runtime: ${NODE_API_RUNTIME}`);
console.warn('#'.repeat(100));

const ignoreWarnCodes = new Set(['THIS_IS_UNDEFINED', 'CIRCULAR_DEPENDENCY']);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _adapterNode = adapterNode();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _adapterSWA = adapterSWA({
  // TODO: https://github.com/getsentry/sentry-javascript/issues/16190
	// external: ['@sentry/sveltekit'],
	external: ['@babel/preset-typescript/package.json'],
	alias: {
		'@sentry/sveltekit': join(
			process.cwd(),
			'node_modules/@sentry/sveltekit/build/esm/index.server.js'
		)
	},
	onwarn: (warning, handler) => {
		if (
			ignoreWarnCodes.has(warning.code) ||
			(warning.plugin === 'sourcemaps' && warning.code === 'PLUGIN_WARNING')
		) {
			// Ignore this warning
			return;
		}
		// Use default warning handler for all other warnings
		handler(warning);
	},
	apiDir: './func',
	// cleanApiDir: true,
	// staticDir: './customStatic',
	// cleanStaticDir: true,
	customStaticWebAppConfig: {
		platform: {
			apiRuntime: NODE_API_RUNTIME
		}
	},
	emulate: {
		role: 'authenticated'
	}
});

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: _adapterSWA
		// adapter: process.env.SWA ? _adapterSWA : _adapterNode
	}
};

export default config;
