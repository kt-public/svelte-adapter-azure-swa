import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		sourcemap: true
	},
	plugins: [
		sentrySvelteKit({
			// adapter: process.env.SWA ? 'other' : 'node',
			adapter: 'other',
			sourceMapsUploadOptions: {
				org: 'konstantin-tarmyshov',
				project: 'svelte-adapter-azure-swa',
				sourcemaps: {
					// assets: ['./build/**/*', './func/**/*', './src/**/*', '.svelte-kit/**/*']
					assets: ['./build/**/*', './func/**/*']
				},
				authToken: process.env.SENTRY_AUTH_TOKEN
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
