// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === "production"
      ? [VitePWA({
          registerType: "autoUpdate",
          includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png"],
          manifest: {
            name: "Caply – Subtitle Editor",
            short_name: "Caply",
            start_url: "/",
            display: "standalone",
            background_color: "#0f172a",
            theme_color: "#7c3aed",
            icons: [
              { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
              { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
            ],
          },
          workbox: {
            skipWaiting: true,
            clientsClaim: true,
            navigateFallback: "/index.html",
            navigateFallbackDenylist: [/^\/api/, /^\/auth/, /^\/login/],
          },
        })]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"), // 👈 זה האליאס הנכון
    },
  },

  server: {
    host: "0.0.0.0",
    port: 5174,
    strictPort: true,
    hmr: { host: "192.168.1.206", port: 5174, protocol: "ws" },
    proxy: {
      "/api":   { target: "http://localhost:8765", changeOrigin: true, secure: false, ws: true, cookieDomainRewrite: "" },
      "/login": { target: "http://localhost:8765", changeOrigin: true, secure: false, ws: true, cookieDomainRewrite: "" },
      "/auth":  { target: "http://localhost:8765", changeOrigin: true, secure: false, ws: true, cookieDomainRewrite: "" },
      "/ipapi": {
        target: "https://ipapi.co",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ipapi/, ""),
      },
    },
    // 👇 מאפשר ל-Vite לשרת קבצים מחוץ ל-root ( ../shared )
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
}));
