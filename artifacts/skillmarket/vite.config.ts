import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";

export default defineConfig(async () => {
  const devPlugins = isDev
    ? [
        (await import("@replit/vite-plugin-runtime-error-modal")).default(),
        (await import("@replit/vite-plugin-cartographer")).cartographer(),
      ]
    : [];

  return {
  plugins: [
    react(),
    tailwindcss(),
    ...devPlugins,
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  };
});
