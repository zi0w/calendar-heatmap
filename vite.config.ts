import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "demo",           // 데모 앱 루트를 demo/ 폴더로
  plugins: [react()],
  server: {
    port: 5173
  }
});
