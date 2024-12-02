import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from 'path';

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
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        client: resolve(__dirname, 'src/client/entry-client.tsx'),
        server: resolve(__dirname, 'src/server/entry-server.tsx')
      }
    }
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  ssr: {
    noExternal: ['react-dropzone', '@clerk/clerk-react', 'framer-motion']
  }
});