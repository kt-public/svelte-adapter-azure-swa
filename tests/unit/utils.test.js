import { describe, expect, test } from 'vitest';
import { sentryRewriteSourcesFactory } from '../../src';

describe('generateConfig', () => {
	test('no custom config', () => {
		const rewrite = sentryRewriteSourcesFactory(['./tests/unit/fixtures'], console.log);
		let source = rewrite('../../.svelte-kit/output/server/nodes/1.js', undefined);
		expect(source).toEqual('tests/unit/.svelte-kit/output/server/nodes/1.js');
		source = rewrite('whatever', undefined);
		expect(source).toEqual('whatever');
	});
});
