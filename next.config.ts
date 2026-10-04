import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship the SQL migrations with the server so they can run on first request
  outputFileTracingIncludes: {
    "/app": ["./drizzle/**/*"],
    "/app/**": ["./drizzle/**/*"],
  },
};

export default nextConfig;
