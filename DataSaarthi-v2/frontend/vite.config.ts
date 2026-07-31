import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["plotly.js-dist-min", "ag-grid-community", "ag-grid-react"],
  },
  build: {
    commonjsOptions: { transformMixedEsModules: true },
    chunkSizeWarningLimit: 7000,
  },
});
