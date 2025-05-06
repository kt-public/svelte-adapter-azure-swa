import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import fs from 'node:fs';
import path, { join, relative } from 'node:path';
import { defineConfig } from 'vite';

export function list_files(dir: string, filter: (file: string) => boolean) {
	const files: string[] = [];

	function walk(current: string) {
		for (const file of fs.readdirSync(path.resolve(dir, current))) {
			const child = path.posix.join(current, file);
			if (fs.statSync(path.resolve(dir, child)).isDirectory()) {
				walk(child);
			} else {
				if (!filter || filter(child)) {
					files.push(child);
				}
			}
		}
	}

	if (fs.existsSync(dir)) walk('');

	return files;
}

const listFiles: string[] = [];

// const consoleLog = console.warn.bind(console, '[SENTRY]');
// Console log do nothing
const consoleLog = (...args: any[]) => {};

export default defineConfig({
	build: {
		sourcemap: true
	},
	plugins: [
		sentrySvelteKit({
			adapter: 'other',
			sourceMapsUploadOptions: {
				org: 'konstantin-tarmyshov',
				project: 'svelte-adapter-azure-swa',
				sourcemaps: {
					assets: ['./build/**/*', './func/**/*']
				},
				authToken: process.env.SENTRY_AUTH_TOKEN,
				unstable_sentryVitePluginOptions: {
					sourcemaps: {
						rewriteSources(source, map) {
							if (listFiles.length === 0) {
								listFiles.push(
									...list_files('./build', (file) => file.endsWith('.js')).map((file) =>
										join('./build', file)
									)
								);
								listFiles.push(
									...list_files('./func', (file) => file.endsWith('.js')).map((file) =>
										join('./func', file)
									)
								);
								consoleLog('List of files:', listFiles);
							}
							consoleLog('---------------------');
							consoleLog('Rewriting source path:', source);
							const file = map.file; // this is just a filename without path
							consoleLog('Searching for file:', file);
							const filePath = listFiles.find((filePath) => {
								if (!filePath.endsWith(file)) {
									return false;
								}
								consoleLog('Filter: Found file path:', filePath);
								// Now check if its our map file
								const mapFilePath = `${filePath}.map`;
								if (!fs.existsSync(mapFilePath)) {
									return false;
								}
								const _map = JSON.parse(fs.readFileSync(mapFilePath, 'utf-8'));
								// Check if requested source is in the list of sources in the _map
								const _source = _map.sources.find((src: string) => source === src);
								if (!_source) {
									return false;
								}
								consoleLog('Filter: Source found in map:', source);
								return true;
							});
							if (!filePath) {
								consoleLog('#'.repeat(20));
								consoleLog('File path not found for:', file);
								consoleLog('#'.repeat(20));
								return source;
							}
							consoleLog('Found file path:', filePath);
							const fileDir = filePath.split('/').slice(0, -1).join('/');
							consoleLog('File directory:', fileDir);
							const sourcePath = join(fileDir, source);
							consoleLog('Source path:', sourcePath);
							const newSource = relative(process.cwd(), sourcePath).replace(/\\/g, '/');
							consoleLog('New source path:', newSource);
							return newSource;
						}
					}
				}
			}
		}),
		sveltekit()
		// istanbul({
		// 	include: ['src/*', '../../src/entry/*', './func/sk_render/*'],
		// 	exclude: ['node_modules', 'test/'],
		// 	extension: ['.js', '.ts', '.svelte'],
		// 	requireEnv: false,
		// 	forceBuildInstrument: true
		// })
	],
	test: {
		workspace: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
