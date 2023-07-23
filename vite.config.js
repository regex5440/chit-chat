import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "node:path";

const themeVariables = path.resolve(__dirname, "src/Layout/theme/mixins.sass");

// https://vitejs.dev/config/
export default ({ mode }) => {
  return defineConfig({
    "process.env": {},
    plugins: [
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
