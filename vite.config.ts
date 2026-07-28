import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { visualizer } from "rollup-plugin-visualizer";


const vendorReact = new RegExp(
  String.raw`[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]`
);
const vendorRadix = new RegExp(String.raw`[\\/]node_modules[\\/]@radix-ui[\\/]`);
const vendorQuery = new RegExp(String.raw`[\\/]node_modules[\\/]@tanstack[\\/]`);
const vendorRecharts = new RegExp(String.raw`[\\/]node_modules[\\/]recharts[\\/]`);
const vendorSupabase = new RegExp(String.raw`[\\/]node_modules[\\/]@supabase[\\/]`);
const vendorAll = new RegExp(String.raw`[\\/]node_modules[\\/]`);

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Explicit vendor splits keep per-route JS chunks small so navigation
        // lazy-loads only the code for the clicked route, not the entire app.
        manualChunks(id) {
          if (vendorReact.test(id)) return "vendor-react";
          if (vendorRadix.test(id)) return "vendor-radix";
          if (vendorQuery.test(id)) return "vendor-query";
          if (vendorRecharts.test(id)) return "vendor-recharts";
          if (vendorSupabase.test(id)) return "vendor-supabase";
          if (vendorAll.test(id)) return "vendor";
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: {
        entry: "src/server.ts",
      },
      serverFns: {
        disableCsrfMiddlewareWarning: true,
      },
    }),
    nitro({
      preset: "vercel",
    }),
    viteReact(),
    visualizer({
      filename: "./stats.html",
      gzipSize: true,
      brotliSize: true,
    })
  ],
});