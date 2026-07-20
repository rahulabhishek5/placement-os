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
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "vendor-react", test: vendorReact },
            { name: "vendor-radix", test: vendorRadix },
            { name: "vendor-query", test: vendorQuery },
            { name: "vendor-recharts", test: vendorRecharts },
            { name: "vendor-supabase", test: vendorSupabase },
            { name: "vendor", test: vendorAll },
          ],
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