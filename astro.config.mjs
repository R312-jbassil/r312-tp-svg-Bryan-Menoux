// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

<<<<<<< Updated upstream
import node from "@astrojs/node";
=======
import netlify from "@astrojs/netlify";
>>>>>>> Stashed changes

// https://astro.build/config
export default defineConfig({
  output: "server",

  vite: {
    plugins: [tailwindcss()],
  },
<<<<<<< Updated upstream
  adapter: node({
    mode: "standalone",
  }),
=======

  adapter: netlify(),
>>>>>>> Stashed changes
});
