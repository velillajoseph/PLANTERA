/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        // The catalog sells pots and supplies too, so /plant was misleading.
        // 308 rather than 307: the old path is gone for good. Note browsers
        // cache this hard — reverting the rename would strand them.
        source: '/plant/:id',
        destination: '/product/:id',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
