import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _adapterNode = adapterNode();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _adapterSWA = adapterSWA({
	apiDir: './func',
	customStaticWebAppConfig: {
		platform: {
			apiRuntime: NODE_API_RUNTIME
		}
	},
	external: ['@babel/preset-typescript', 'fsevents']
});

const config = {
	preprocess: vitePreprocess(),
	kit: {
		// adapter: _adapterNode
		adapter: process.env.SWA ? _adapterSWA : _adapterNode
	}
};

export default config;
