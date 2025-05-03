import { esbuildServer } from './esbuild/server.js';
import { rollupClient } from './rollup/client.js';
import { rollupServer } from './rollup/server.js';
import { buildSWAConfig } from './swa-config/index.js';

/** @type {import('./index.js').default} */
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

			// rollup cannot resolve @sentry/sveltekit at the moment for the node environment
			// So we first rollup the server to a temporary directory
			// and then esbuild that intermedate file to the final output directory
			await rollupServer(builder, outDir, tmpDir, options);
			await esbuildServer(builder, outDir, tmpDir, options);
			// Now rollup the client files
			await rollupClient(builder, outDir, options);
			// Now build the staticwebapp.config.json file
			await buildSWAConfig(builder, outDir, tmpDir, options);
		}
	};
}
