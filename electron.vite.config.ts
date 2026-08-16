import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: path.join(root, "electron/main/index.ts"),
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: path.join(root, "electron/preload/index.ts"),
      },
    },
  },
  renderer: {
    root,
    plugins: [react()],
    build: {
      rollupOptions: {
        input: path.join(root, "index.html"),
      },
    },
  },
});
