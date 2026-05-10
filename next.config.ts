import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Expose build-time metadata to the client bundle so the UI can show
  // which commit is currently deployed. Vercel auto-populates
  // VERCEL_GIT_COMMIT_SHA and VERCEL_GIT_COMMIT_REF during build.
  // Local dev falls back to "local" so we can tell the environments apart.
  env: {
    NEXT_PUBLIC_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    NEXT_PUBLIC_GIT_BRANCH: process.env.VERCEL_GIT_COMMIT_REF ?? 'local',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
