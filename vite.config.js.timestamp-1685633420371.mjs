// vite.config.js
import { defineConfig } from "file:///F:/chit-chat/node_modules/vite/dist/node/index.js";
import react from "file:///F:/chit-chat/node_modules/@vitejs/plugin-react/dist/index.mjs";
import svgr from "file:///F:/chit-chat/node_modules/vite-plugin-svgr/dist/index.mjs";
import path from "node:path";
var __vite_injected_original_dirname = "F:\\chit-chat";
var themeVariables = path.resolve(__vite_injected_original_dirname, "src/Layout/theme/mixins.sass");
var vite_config_default = ({ mode }) => {
  return defineConfig({
    "process.env": {},
    plugins: [
      react(),
      svgr({
        exportAsDefault: true,
        include: "**/*.svg"
      })
    ],
    resolve: {
      alias: {
        "@theme-variables": themeVariables
      }
    }
  });
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJGOlxcXFxjaGl0LWNoYXRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkY6XFxcXGNoaXQtY2hhdFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRjovY2hpdC1jaGF0L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCBzdmdyIGZyb20gXCJ2aXRlLXBsdWdpbi1zdmdyXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XG5cbmNvbnN0IHRoZW1lVmFyaWFibGVzID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvTGF5b3V0L3RoZW1lL21peGlucy5zYXNzXCIpO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgKHsgbW9kZSB9KSA9PiB7XG4gIHJldHVybiBkZWZpbmVDb25maWcoe1xuICAgIFwicHJvY2Vzcy5lbnZcIjoge30sXG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIHN2Z3Ioe1xuICAgICAgICBleHBvcnRBc0RlZmF1bHQ6IHRydWUsXG4gICAgICAgIGluY2x1ZGU6IFwiKiovKi5zdmdcIixcbiAgICAgIH0pLFxuICAgIF0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgXCJAdGhlbWUtdmFyaWFibGVzXCI6IHRoZW1lVmFyaWFibGVzLFxuICAgICAgfSxcbiAgICB9LFxuICB9KTtcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBOLFNBQVMsb0JBQW9CO0FBQ3ZQLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU0saUJBQWlCLEtBQUssUUFBUSxrQ0FBVyw4QkFBOEI7QUFHN0UsSUFBTyxzQkFBUSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQzNCLFNBQU8sYUFBYTtBQUFBLElBQ2xCLGVBQWUsQ0FBQztBQUFBLElBQ2hCLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLEtBQUs7QUFBQSxRQUNILGlCQUFpQjtBQUFBLFFBQ2pCLFNBQVM7QUFBQSxNQUNYLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxvQkFBb0I7QUFBQSxNQUN0QjtBQUFBLElBQ0Y7QUFBQSxFQUNGLENBQUM7QUFDSDsiLAogICJuYW1lcyI6IFtdCn0K
