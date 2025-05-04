---
'@ktarmyshov/svelte-adapter-azure-swa': patch
---

Remove esbuild, update rollup settings for Azure Function to build without issues. Multiple chunks are generated for the Azure Functions - this fixes the issue with size of file and size of sourcemaps. Sentry seem to work, not ideally, but close.
