import { defineConfig } from "tsup";

export default defineConfig({
  tsconfig: "tsconfig.json",
  entry: ["src/index.tsx"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "@tx404/core"],
});
