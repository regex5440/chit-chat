import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "node:path";
import baseSsl from "@vitejs/plugin-basic-ssl";

const themeVariables = path.resolve(__dirname, "src/views/theme/mixins.sass");

// https://vitejs.dev/config/
export default ({ mode }) => {
  return defineConfig({
    "process.env": {},
    envPrefix: "CC",
    plugins: [
      // baseSsl(),
      react(),
      svgr({
        exportAsDefault: true,
        include: "**/*.svg",
      }),
    ],
    resolve: {
      alias: {
        "@theme-variables": themeVariables,
      },
    },
  });
};
