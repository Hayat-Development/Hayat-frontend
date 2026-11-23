import process from "node:process";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const { VITE_API_PROXY_TARGET } = loadEnv(mode, process.cwd());
  return {
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        "/api": {
          target: VITE_API_PROXY_TARGET || "https://hayat-backend-lh8k.onrender.com",
          changeOrigin: true,
        },
      },
    },
  };
});
