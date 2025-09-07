import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["@babylonjs/havok"],
  },
  build: {
    rollupOptions: {
      external: ["@babylonjs/havok"],
      output: {
        globals: {
          "@babylonjs/havok": "HavokPhysics",
        },
      },
    },
  },
});
