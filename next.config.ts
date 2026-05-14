import type { NextConfig } from "next";

const staticExport = process.env.STATIC_EXPORT === "true";
const pagesBasePath = "/cardigan-therapy-platform";

const nextConfig: NextConfig = {
  assetPrefix: staticExport ? `${pagesBasePath}/` : undefined,
  basePath: staticExport ? pagesBasePath : undefined,
  output: staticExport ? "export" : undefined,
  images: {
    unoptimized: staticExport,
  },
  trailingSlash: staticExport,
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
