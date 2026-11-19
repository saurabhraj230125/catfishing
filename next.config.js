/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  poweredByHeader: false,
  generateEtags: true,
  webpack: (config, { dev }) => {
    // Disable stale webpack chunk cache in dev to prevent missing module errors
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;
