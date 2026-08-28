/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: false,
  images: {
    formats: ['image/webp'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        encoding: false,
        path: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
      };
    }

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/@mediapipe/ },
      { module: /node_modules\/face-api\.js/ },
      { module: /node_modules\/node-fetch/ },
      /Failed to parse source map/,
    ];

    return config;
  },
};

module.exports = nextConfig;

