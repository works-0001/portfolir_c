import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/portfolir_c',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
