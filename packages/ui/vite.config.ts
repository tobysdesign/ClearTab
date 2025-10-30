import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()] as PluginOption[],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
