/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
  images: {
    domains: ['127.0.0.1', 'localhost'],
    unoptimized: true,
  },
};

export default nextConfig;
