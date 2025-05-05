---
'@ktarmyshov/svelte-adapter-azure-swa': minor
---

Rework `options.external`.

- `options.external`
  - default: `['fsevents', '@azure/functions']`
  - other externals, if `apiDir` is not provided, will be automatically added to the generated Azure Functions `package.json`
