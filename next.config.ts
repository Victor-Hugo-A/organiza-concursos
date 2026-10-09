import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
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
