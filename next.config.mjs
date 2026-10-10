/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.zanta-mini.store" },
    ],
  },
};

export default nextConfig;