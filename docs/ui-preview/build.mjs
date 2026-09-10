// Run from anywhere: node docs/ui-preview/build.mjs /absolute/path/preview.html
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
const here = path.dirname(fileURLToPath(import.meta.url));
const client = path.resolve(here, "../../client");
const require = createRequire(path.join(client, "package.json"));
const { build } = await import(require.resolve("vite"));
const { default: react } = await import(require.resolve("@vitejs/plugin-react"));
const out = await fs.mkdtemp(path.join(os.tmpdir(), "collaboard-preview-"));
await build({
  root: client, configFile: false, plugins: [react()],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  resolve: { alias: [
    { find: /^\.{1,2}\/services\/api$/, replacement: path.join(here, "api.js") },
    { find: /^\.{1,2}\/services\/realtime$/, replacement: path.join(here, "realtime.js") },
    ...["react", "react-dom", "react-router"].map(name => ({ find: name, replacement: path.join(client, "node_modules", name) })),
  ] },
  build: { outDir: out, emptyOutDir: true, cssCodeSplit: false,
    lib: { entry: path.join(here, "entry.jsx"), name: "CollaBoardPreview", formats: ["iife"], fileName: () => "preview.js" },
  },
});
const files = await fs.readdir(out);
const css = (await Promise.all(files.filter(f => f.endsWith(".css")).map(f => fs.readFile(path.join(out,f),"utf8")))).join("\n");
const js = await fs.readFile(path.join(out,"preview.js"),"utf8");
const toolbar = '.preview-toolbar{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;padding:.75rem 1.25rem;background:#172c48;color:white;font:13px/1.4 system-ui}.preview-toolbar strong{font-size:14px}.preview-toolbar>span{opacity:.85}.preview-toolbar label{margin-left:auto;display:flex;align-items:center;gap:.5rem}.preview-toolbar select{font:inherit;padding:.4rem;border-radius:.4rem;border:1px solid #cad3df;background:white;color:#172c48}';
const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>CollaBoard · UI review</title><style>'+css+'\n'+toolbar+'</style></head><body><div id="root"></div><script>'+js.replaceAll('</script','<\\/script')+'</script></body></html>';
const target = process.argv[2] || path.join(here,"CollaBoard-UI-Preview.html");
await fs.writeFile(target, html);
console.log(`Standalone preview written: ${target}`);
