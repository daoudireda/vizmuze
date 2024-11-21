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
    proxy: {
      '/embed.js': {
        target: 'https://www.tiktok.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/embed\.js/, '/embed.js'),
        headers: {
          'Referer': 'https://www.tiktok.com',
          'Origin': 'https://www.tiktok.com'
        }
      },
      '/embed': {
        target: 'https://www.instagram.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/embed/, '/embed.js'),
        headers: {
          'Referer': 'https://www.instagram.com',
          'Origin': 'https://www.instagram.com'
        }
      }
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