import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import netlify from "@netlify/vite-plugin-tanstack-start"; // Added the missing import

export default defineConfig({
  resolve: {
    tsconfigPaths: true, // Kept exactly as you had it
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: {
        entry: "src/server.ts",
      },
    }),
    netlify(), // Added the missing function execution parentheses
    viteReact(),
  ],
});