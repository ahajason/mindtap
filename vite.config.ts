import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  // Vite 7 + Tauri 2 标配:固定端口 + 严格端口占用,避免启动竞态
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: false,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 1421,
    },
    watch: {
      // 监听整个项目目录,但忽略 src-tauri (Rust 单独跑)
      ignored: ["**/src-tauri/**"],
    },
  },

  // 路径别名 - 与 tsconfig.json 的 paths 同步
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // 环境变量前缀:Tauri 注入的 TAURI_* 变量可用 import.meta.env.VITE_* 暴露
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    // Tauri 在 macOS/Linux 上对 sourcemap 不友好;Windows 上需要
    target:
      process.env.TAURI_ENV_PLATFORM == "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
}));