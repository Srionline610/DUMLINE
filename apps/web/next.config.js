/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@dumline/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async rewrites() {
    const rawApiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const backendOrigin = rawApiUrl.replace(/\/api\/?$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${backendOrigin}/health`,
      },
    ];
  },
};

module.exports = nextConfig;

