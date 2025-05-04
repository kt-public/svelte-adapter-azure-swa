---
'@ktarmyshov/svelte-adapter-azure-swa': patch
---

Added emulation of the platform for authenticated and non-authenticated user.

`platform.clientPrincipal`, just as `platform.user` is set to null if user is not authenticated to align with Azure HttpUser typing.
