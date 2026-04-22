import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://babyshop.aptech.osii.me",
        changeOrigin: true,
        secure: false, // Helps bypass local SSL certificate issues
      },
    },
  },
});
