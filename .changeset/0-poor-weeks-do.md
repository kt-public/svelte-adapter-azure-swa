---
'@ktarmyshov/svelte-adapter-azure-swa': minor
---

Migrate to rollup, fix issue with generated sourcemaps on the client.

The adapter was migrated to the `rollup` under the hood, instead of `esbuild`. The [same issue as for the `adapter-node`](https://github.com/sveltejs/kit/issues/10040) was taken into account and resolved.
