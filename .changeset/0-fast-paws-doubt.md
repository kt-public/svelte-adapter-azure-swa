---
'@ktarmyshov/svelte-adapter-azure-swa': patch
---

Add prefixDir option to the sentryRewriteSourcesFactory util function. If monorepo is used, user can provide the prefix dir location, which will be joined (`path.join`) during rewriting of source paths for sentry.
