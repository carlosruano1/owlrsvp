/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    // Only ignore type errors in development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // Only ignore ESLint errors in development
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  // Configure image domains if using external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nbdsqxuknvzbyxwasukt.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        port: '',
        pathname: '/**',
      }
    ],
  },
  poweredByHeader: false,
  // Improve static generation
  output: 'standalone',
};

export default nextConfig;
