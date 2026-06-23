import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, the Vite server runs on 5173 and proxies API calls to the Express
// backend on 5001 so the frontend and backend can run side by side.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5001",
    },
  },
});
