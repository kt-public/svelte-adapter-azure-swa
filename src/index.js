import { bundleClient } from './client/index.js';
import {
	CLIENT_DEFAULT_OUT_DIR_PATH,
	DEFAULT_OUT_DIR_PATH,
	SERVER_DEFAULT_OUT_DIR_PATH
} from './constants.js';
import { emulatePlatform } from './emulator/index.js';
import { bundleServer } from './server/index.js';
import { writeSWAConfig } from './swa-config/index.js';

/** @type {import('.').default} */
export default function (options = {}) {
	return {
		name: 'adapter-azure-swa',

		async adapt(builder) {
			const start = performance.now();
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

			builder.rimraf(DEFAULT_OUT_DIR_PATH);
			if (options.apiDir !== undefined) {
				builder.log.warn(
					'If you override the apiDir location, make sure that it is a valid Azure Functions location.'
				);
			}

			const tmpDir = builder.getBuildDirectory('adapter-azure-swa');
			builder.rimraf(tmpDir);
			builder.mkdirp(tmpDir);

			const apiOutDirPath = options.apiDir ?? SERVER_DEFAULT_OUT_DIR_PATH;
			await bundleServer(builder, apiOutDirPath, tmpDir, options);

			const clientOutDirPath = options.staticDir ?? CLIENT_DEFAULT_OUT_DIR_PATH;
			await bundleClient(builder, clientOutDirPath, options);

			const cleanStaticDir = options.cleanStaticDir ?? true;
			if (options.staticDir !== undefined && cleanStaticDir) {
				const _staticDir = options.staticDir;
				builder.log(`Cleaning up static output directory: ${_staticDir}`);
				builder.rimraf(_staticDir);
			}

			await writeSWAConfig(builder, clientOutDirPath, options);

			const duration = performance.now() - start;
			builder.log.success(`built in ${(duration / 1000).toFixed(2)}s`);
		},
		async emulate() {
			return {
				platform({ config, prerender }) {
					return emulatePlatform(config, prerender, options.emulate);
				}
			};
		}
	};
}

export { list_files, sentryRewriteSourcesFactory } from './utils.js';
