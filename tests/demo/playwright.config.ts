import { defineConfig, PlaywrightTestConfig } from '@playwright/test';

console.warn('#'.repeat(100));
let webServer: PlaywrightTestConfig['webServer'];
if (process.env.SWA) {
	console.warn('Running in SWA mode');
	webServer = {
		timeout: 120 * 1000,
		command: 'npm run build && npm run swa -- --verbose=silly',
		port: 4280
	};
} else if (process.env.CI) {
	console.warn('Running in CI mode');
	webServer = undefined;
} else {
	console.warn('Running in local mode');
	webServer = {
		command: 'npm run build && npm run preview',
		port: 4173
	};
}
console.warn('#'.repeat(100));

export default defineConfig({
	webServer,
	testDir: 'e2e'
});
