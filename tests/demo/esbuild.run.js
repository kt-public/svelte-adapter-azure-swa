import { build } from 'esbuild';

/** @type {import('esbuild').BuildOptions} */
const options = {
	entryPoints: ['func/sk_render/index.js'],
	bundle: true,
	outfile: 'func/sk_render/bundle.js',
	platform: 'node',
	target: 'node20',
	format: 'cjs',
	external: ['@azure/functions', '@babel/preset-typescript', 'fsevents'],
	sourcemap: true
};

async function run() {
	await build(options);
	console.log('Build completed successfully');
}
run();
