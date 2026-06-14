import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The logistics app talks to Graf only from the server (route handlers),
  // so no rewrites/CORS are needed on the client.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
