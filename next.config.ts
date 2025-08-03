
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // output: 'export', // This is causing issues with server-side features. Disable for now.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Required for static export with Capacitor, but can be reviewed later.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    allowedDevOrigins: [
        '*.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev'
    ],
  },
};

export default nextConfig;
