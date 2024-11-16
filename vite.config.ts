import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util", "@ffmpeg/core-mt"],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      // Remove report-to and make it less strict
      // "Access-Control-Allow-Origin": "*",
      // "Cross-Origin-Embedder-Policy": "require-corp",
      "Referrer-Policy": "origin",
      "Content-Security-Policy":
        "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';",
    },
    proxy: {
      // Proxy TikTok requests to avoid CORS issues
      "/tiktok": {
        target: "https://www.tiktok.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tiktok/, ""),
        secure: false,
      },
      "/youtube": {
        target: "https://www.youtube.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/youtube/, ""),
        secure: false,
      },
    },
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
