import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas", "tesseract.js"],
  outputFileTracingIncludes: {
    "/api/materials/*/analyze": [
      "./scripts/extract-pdf.mjs",
      "./node_modules/pdfjs-dist/**/*",
      "./node_modules/@napi-rs/canvas*/**/*",
      "./node_modules/tesseract.js/**/*",
      "./node_modules/tesseract.js-core/**/*",
    ],
  },
};

export default nextConfig;
