import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [],
  },
  rewrites: async () => {
    return [
      {
        source: "/api/v1/:path*",
        destination: "/api/index.py",
      },
      {
        source: "/api/:path*",
        destination: "/api/index.py",
      },
    ];
  },
};

export default nextConfig;

