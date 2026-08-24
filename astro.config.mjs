import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://amiteshdwivedijhu-ship-it.github.io",
  markdown: { shikiConfig: { theme: "vitesse-dark", wrap: true } },
  build: { format: "directory" },
});
