import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const isE2e = process.env.E2E === "true";

export default defineConfig({
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
