import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util", "@ffmpeg/core-mt"],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Referrer-Policy": "origin",
      "Content-Security-Policy":
        "default-src * 'unsafe-inline' 'unsafe-eval'; " +
        "script-src * 'unsafe-inline' 'unsafe-eval'; " +
        "connect-src * 'unsafe-inline'; " +
        "img-src * data: blob: 'unsafe-inline'; " +
        "frame-src *; " +
        "style-src * 'unsafe-inline';",
    },
  },
  build: {
    target: "esnext",
    sourcemap: true,
    outDir: 'dist'
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});