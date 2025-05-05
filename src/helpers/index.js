import { join, posix } from 'path';
import { fileURLToPath } from 'url';

export const apiServerDir = 'server';
export const apiFunctionDir = 'sk_render';
export const apiFunctionFile = 'index.js';
const files = fileURLToPath(new URL('../files', import.meta.url));
export const filesApi = join(files, 'api');
export const entry = fileURLToPath(new URL('../entry/index.js', import.meta.url));

/** @type {import('.').getPaths} */
export function getPaths(builder, tmpDir) {
	// use posix because of https://github.com/sveltejs/kit/pull/3200
	const serverPath = builder.getServerDirectory();
	const serverFile = join(serverPath, 'index.js');
	const serverRelativePath = posix.relative(tmpDir, builder.getServerDirectory());
	const manifestFile = join(tmpDir, 'manifest.js');
	const envFile = join(tmpDir, 'env.js');
	return {
		serverPath,
		serverFile,
		serverRelativePath,
		manifestFile,
		envFile
	};
}
