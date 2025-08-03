
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Important change for Capacitor: output static files
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Required for static export
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
