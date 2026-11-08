import type { NextConfig } from "next";

/**
 * STATIC_EXPORT=1 builds a fully static site (GitHub Pages): no API routes,
 * proxy or server-side Claude calls; the Fortune Teller runs in the browser with
 * localStorage + the offline generator. Use `npm run build:static`.
 */
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = isStatic ? (process.env.PAGES_BASE_PATH ?? "") : "";

const nextConfig: NextConfig = {
  ...(isStatic && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: isStatic ? "1" : "0",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
