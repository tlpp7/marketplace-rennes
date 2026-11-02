import type { NextConfig } from "next";
// Server-side social features require Node.js; static export is no longer supported.
const nextConfig: NextConfig = { trailingSlash: true, images: {unoptimized:true} };
export default nextConfig;
