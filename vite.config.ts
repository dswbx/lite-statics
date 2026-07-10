import { fileURLToPath, URL } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const isE2e = process.env.E2E === "true";

export default defineConfig({
   resolve: {
      alias: {
         "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
   },
   plugins: [
      react(),
      tailwindcss(),
      cloudflare({
         persistState: isE2e ? { path: ".wrangler-e2e/state" } : true,
      }),
   ],
   server: {
      watch: {
         ignored: ["**/.wrangler/**", "**/.wrangler-e2e/**"],
      },
   },
});
