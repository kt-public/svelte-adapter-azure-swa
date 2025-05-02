// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = !process.env.SWA; // swa at the moment has issue with serving prerendered assets

console.warn('#'.repeat(100));
console.warn(`SWA: ${process.env.SWA}`);
console.warn(`prerender: ${prerender}`);
console.warn('#'.repeat(100));
