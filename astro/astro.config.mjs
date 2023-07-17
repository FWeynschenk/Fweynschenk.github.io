import { defineConfig } from 'astro/config';

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  outDir: "../docs",
  output: "static",
  site: "https://flwe.nl",
  integrations: [tailwind()]
});