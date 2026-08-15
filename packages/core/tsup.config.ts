import { defineConfig } from "tsup";

export default defineConfig({
  tsconfig: "tsconfig.json",
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["@starknet-io/types-js"],
});
