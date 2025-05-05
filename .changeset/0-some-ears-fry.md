---
'@ktarmyshov/svelte-adapter-azure-swa': minor
---

Rework bundling as an ES module instead of CJS (increases speed). Rework `options.external`.

- `options.external`
  - default: `['fsevents', '@azure/functions']`
  - other externals, if `apiDir` is not provided, will be automatically added to the generated Azure Functions `package.json`
