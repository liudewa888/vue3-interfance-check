import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import ElementPlus from "unplugin-element-plus/vite";
// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [vue(),ElementPlus()],
  optimizeDeps: {},
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        // 选项写法
        target: "http://localhost:9080",
        changeOrigin: true,
        rewrite: (path) => {
          path = path.replace(/^\/api/, "");
          // 进行调试输出
          console.log("vite proxy url: ", path);
          return path;
        },
      },
    },
  },
});
