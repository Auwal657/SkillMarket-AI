import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/index.js",
  sourcemap: true,
  plugins: [
    {
      name: "make-all-packages-external",
      setup(build) {
        const filter = /^[^./]|^\.[^./]|^\.\.[^/]/;
        build.onResolve({ filter }, (args) => {
          if (args.path.startsWith("@workspace/")) return null;
          return { path: args.path, external: true };
        });
      },
    },
  ],
});
