import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
	build: {
		sourcemap: true
	},
	plugins: [
		sveltekit(),
		istanbul({
			include: ['src/*', '../../src/entry/*', './func/sk_render/*'],
			exclude: ['node_modules', 'test/'],
			extension: ['.js', '.ts', '.svelte'],
			requireEnv: false,
			forceBuildInstrument: true
		})
	],
	test: {
		coverage: {
			provider: 'istanbul', // or 'v8'
			reporter: ['text', 'html', 'clover', 'json', 'lcov'],
			include: ['src/**/*.{js,ts}'],
			exclude: ['node_modules', 'test/']
		},
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
