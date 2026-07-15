import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_URL || "http://localhost:8001";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err, _req, res) => {
              if (!res.headersSent) {
                res.writeHead(502, { "Content-Type": "application/json" });
              }
              res.end(
                JSON.stringify({
                  message: "Something went wrong, please try again later.",
                  detail: err.message,
                  target: apiTarget,
                })
              );
            });
          },
        },
      },
    },
  };
});
