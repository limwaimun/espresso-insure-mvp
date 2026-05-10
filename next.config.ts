import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // pdfjs-dist (used in lib/policy-extraction/pdfjs-extract.ts) declares
  // @napi-rs/canvas as an optional dependency. Bundling pdfjs causes the
  // optional require to throw at module-load time on Vercel, before our
  // try/catch can run. Marking it external keeps it as a runtime require
  // and lets Node handle the missing optional dep gracefully (logs a
  // warning, continues). See B-pe-15b.2.
  serverExternalPackages: ['pdfjs-dist'],
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
