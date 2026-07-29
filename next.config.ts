import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Hosted Supabase Storage (signed URLs for issue evidence photos).
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/sign/**" },
      // Local Supabase CLI storage during development.
      { protocol: "http", hostname: "127.0.0.1", port: "54321", pathname: "/storage/v1/object/sign/**" },
    ],
  },
};

export default nextConfig;
