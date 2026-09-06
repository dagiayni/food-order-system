import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/proxy/foods/:path*",
        destination: "http://localhost:5001/api/foods/:path*",
      },
      {
        source: "/api/proxy/orders/:path*",
        destination: "http://localhost:5002/api/orders/:path*",
      },
      {
        source: "/api/proxy/payments/:path*",
        destination: "http://localhost:5003/api/payments/:path*",
      },
    ];
  },
};

export default nextConfig;
