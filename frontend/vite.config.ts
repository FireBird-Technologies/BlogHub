import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { prerenderPlugin } from "./seo/prerender";

export default defineConfig({
  // prerenderPlugin writes static HTML for /blogs, /blogs/*, /submit-your-newsletter and /tools/* after the build.
  plugins: [react(), prerenderPlugin()],
  server: {
    port: 5173,
  },
});
