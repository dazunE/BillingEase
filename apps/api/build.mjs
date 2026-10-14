// Bundles the API into dist/server.js. The workspace packages (TypeScript source) are
// bundled in; npm packages stay external and load from node_modules at runtime.
import { build } from "esbuild";

await build({
  entryPoints: ["src/server.ts"],
  outfile: "dist/server.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: true,
  plugins: [{
    name: "external-npm",
    setup(b) {
      b.onResolve({ filter: /^[^./]/ }, (args) => (args.path.startsWith("@billingease/") ? null : { path: args.path, external: true }));
    },
  }],
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
});
console.log("built dist/server.js");
