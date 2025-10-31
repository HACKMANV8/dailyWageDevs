import type { NextConfig } from "next";

const nextConfig: NextConfig = {
<<<<<<< HEAD
  /* config options here */
=======
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
        port: '',
        pathname: "/**"
      }
    ]
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "Origin-Agent-Cluster", value: "?1" },
        ],
      },
    ];
  },
  reactStrictMode: false
>>>>>>> 736aa1d (initialising db atlas)
};

export default nextConfig;
