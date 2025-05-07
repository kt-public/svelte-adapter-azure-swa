import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';

/** @type {import('.').list_files} */
export function list_files(dir, filter) {
	/** @type {string[]} */
	const files = [];

	/**
	 *
	 * @param {string} current current directory path
	 * @returns {void}
	 */
	function walk(current) {
		for (const file of readdirSync(resolve(dir, current))) {
			const child = posix.join(current, file);
			if (statSync(resolve(dir, child)).isDirectory()) {
				walk(child);
			} else {
				if (!filter || filter(child)) {
					files.push(child);
				}
			}
		}
	}

	if (existsSync(dir)) walk('');

	return files;
}

/** @type {import('.').sentryRewriteSourcesFactory} */
export function sentryRewriteSourcesFactory(dirs, log = undefined) {
	// We need to build map source (from source map files) -> js file directory
	/** @type {string[]} */
	let mapFiles = [];
	dirs.forEach((dir) => {
		mapFiles = mapFiles.concat(
			list_files(dir, (file) => file.endsWith('.js.map')).map((file) => join(dir, file))
		);
	});
	/** @type {Map<string, string>} */
	const mapSource2JSDir = new Map();
	for (const mapFile of mapFiles) {
		const mapFileDir = dirname(mapFile);
		const map = JSON.parse(readFileSync(mapFile, 'utf-8'));
		const sources = map.sources || [];
		for (const source of sources) {
			mapSource2JSDir.set(source, mapFileDir);
		}
	}
	log?.('-'.repeat(80));
	log?.(
		`Found ${mapSource2JSDir.size} sources in ${mapFiles.length} maps in '${dirs.join(', ')}' directories`
	);
	log?.('-'.repeat(80));

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	return (source, map) => {
		const mapDir = mapSource2JSDir.get(source);
		if (!mapDir) {
			log?.(`Location of sourcemap for source ${source} not found`);
			return source;
		}
		const newSource = join(mapDir, source);
		log?.(`Rewriting source ${source} -> ${newSource}`);
		return newSource;
	};
}
