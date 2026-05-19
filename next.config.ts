import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'byykvsjamtcklwtnjkpf.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'kinescope.io' },
      { protocol: 'https', hostname: '**.kinescope.io' },
      { protocol: 'http', hostname: 'supabase-kong' },
      { protocol: 'https', hostname: 'club.nata-tomshina.ru' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/blog/pohudenie/bez-diet-bez-golodaniy/:path*',
        destination: '/blog/pohudenie/bez-diet-bez-sporta/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/OneSignalSDKWorker.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ]
  },
};

export default nextConfig;
