// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackBuildWorker: false, // CSS worker crash ko roke ga
  },
  // Build ke dauran memory bachane ke liye (optional):
  eslint: { ignoreDuringBuilds: true }, 
};
export default nextConfig;
