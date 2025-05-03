import { Builder } from '@sveltejs/kit';

export type BundleBuildTarget = 'output' | 'intermediate' | 'none';
export type BundleBuildSource = 'source' | 'intermediate';
export type BundleBuild = {
	target: BundleBuildTarget;
	source: BundleBuildSource;
};

export declare const apiServerDir: string;
export declare const apiFunctionDir: string;
export declare const apiFunctionFile: string;
export declare const files: string;
export declare const entry: string;

export type GetPaths = {
	serverPath: string;
	serverFile: string;
	serverRelativePath: string;
	manifestFile: string;
	envFile: string;
};
export declare function getPaths(builder: Builder, tmpDir: string): GetPaths;
