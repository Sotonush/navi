import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "../src/main/resources/static",
    emptyOutDir: true,
  },
  server: {
    port: 5199,
    proxy: {
      "/api": "http://localhost:8080",
      "/wired": { target: "ws://localhost:8080", ws: true },
    },
  },
});
