import { writeFileSync } from 'fs';
import { join } from 'path';
import { apiFunctionDir, apiServerDir, files, getPaths } from './helpers/index.js';
import { rollupClient } from './rollup/client.js';
import { rollupServer } from './rollup/server.js';
import { buildSWAConfig } from './swa-config/index.js';

/** @type {import('.').default} */
export default function (options = {}) {
	return {
		name: 'adapter-azure-swa',

		async adapt(builder) {
			const { allowReservedSwaRoutes = false } = options;

			const conflictingRoutes =
				builder.routes?.map((route) => route.id).filter((routeId) => routeId.startsWith('/api')) ??
				[];
			if (!allowReservedSwaRoutes && conflictingRoutes.length > 0) {
				builder.log.error(
					`Error: the following routes conflict with Azure SWA's reserved /api route: ${conflictingRoutes.join(
						', '
					)}. Requests to these routes in production will return 404 instead of hitting your SvelteKit app.

To resolve this error, move the conflicting routes so they do not start with /api. For example, move /api/blog to /blog.
If you want to suppress this error, set allowReservedSwaRoutes to true in your adapter options.
					`
				);

				throw new Error('Conflicting routes detected. Please rename the routes listed above.');
			}

			if (options.apiDir !== undefined) {
				builder.log.warn(
					'If you override the apiDir location, make sure that it is a valid Azure Functions location.'
				);
			}

			const tmpDir = builder.getBuildDirectory('adapter-azure-swa');
			const outDir = 'build';
			builder.rimraf(tmpDir);
			builder.rimraf(outDir);
			const cleanApiDir = options.cleanApiDir ?? true;
			if (cleanApiDir) {
				const _apiServerDir = options.apiDir || join(outDir, apiServerDir);
				const _apiFunctionDir = join(_apiServerDir, apiFunctionDir);
				builder.rimraf(_apiFunctionDir);
			}

			builder.mkdirp(tmpDir);

			if (options.apiDir === undefined) {
				const _apiServerDir = join(outDir, apiServerDir);
				builder.log(`Using standard output location for Azure Functions: ${_apiServerDir}`);
				builder.copy(join(files, 'api'), _apiServerDir);
			}

			const { serverRelativePath, manifestFile, envFile } = getPaths(builder, tmpDir);
			const debug = options.debug || false;

			// Write manifest
			writeFileSync(
				manifestFile,
				`export const manifest = ${builder.generateManifest({
					relativePath: serverRelativePath
				})};\n`
			);
			// Write environment
			writeFileSync(envFile, `export const debug = ${debug.toString()};\n`);

			await rollupServer(builder, outDir, tmpDir, options);
			await rollupClient(builder, outDir, options);
			await buildSWAConfig(builder, outDir, tmpDir, options);
		}
	};
}
