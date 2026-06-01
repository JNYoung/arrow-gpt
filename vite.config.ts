import { defineConfig } from "vite";

const repoBase = "/arrow-gpt/";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? repoBase : "/",
});
