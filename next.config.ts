// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { 
    ignoreDuringBuilds: true // Build ke waqt ESLint run nahi hoga (Memory bachegi)
  },
  typescript: { 
    ignoreBuildErrors: true // TypeScript errors build ko nahi rokengy
  },
  productionBrowserSourceMaps: false, // Source maps disable karein
  experimental: {
    cpus: 1, // Server ka sirf 1 CPU thread use karega (Crash se bachne ke liye)
    webpackBuildWorker: false,
    memoryBasedWorkersCount: true,
  },
};
export default nextConfig;
