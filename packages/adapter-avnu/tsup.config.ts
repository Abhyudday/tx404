import { defineConfig } from "tsup";

export default defineConfig({
  tsconfig: "tsconfig.json",
  entry: ["src/index.ts", "src/server.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["@avnu/avnu-sdk", "@tx404/core", "starknet"],
});
