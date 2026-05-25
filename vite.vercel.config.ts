import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";

// Standalone Vite config for deploying to Vercel as a static SPA.
// Does NOT use TanStack Start / Cloudflare — pure client-side build.
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Exclude Node.js modules from browser bundle
    external: [
      "@tanstack/start-storage-context",
      "node:async_hooks",
    ],
  },
  ssr: {
    external: [
      "@tanstack/start-storage-context",
    ],
    noExternal: [],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: [
        "@tanstack/start-storage-context",
      ],
    },
  },
});