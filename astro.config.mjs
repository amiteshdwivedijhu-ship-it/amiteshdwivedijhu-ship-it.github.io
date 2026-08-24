import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://amiteshdwivedi.com",
  markdown: { shikiConfig: { theme: "vitesse-dark", wrap: true } },
  build: { format: "directory" },
});
