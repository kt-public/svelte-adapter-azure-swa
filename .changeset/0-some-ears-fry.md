---
'@ktarmyshov/svelte-adapter-azure-swa': minor
---

Rework bundling as ES module & `options.external`.

- `options.external`
  - default: `['fsevents', '@azure/functions']`
  - other externals, if `apiDir` is not provided, will be automatically added to the generated Azure Functions `package.json`
  - if `apiDir` is provided, the user must take care of defining dependencies in the corresponding `package.json`
