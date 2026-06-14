import path from "path";
import type { NextConfig } from "next";

const outputFileTracingRoot = process.env.NEXT_OUTPUT_TRACING_ROOT
  ? path.resolve(process.env.NEXT_OUTPUT_TRACING_ROOT)
  : undefined;

const nextConfig: NextConfig = {
  ...(outputFileTracingRoot ? { outputFileTracingRoot } : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [320, 480, 640, 768, 1024, 1080, 1920],
    imageSizes: [60, 80, 160, 200, 320, 400, 600],
    minimumCacheTTL: 2592000,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
