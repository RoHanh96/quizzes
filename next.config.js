/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tránh lỗi dev/prod kiểu "Cannot find module './vendor-chunks/next-auth.js'"
  // khi Next bundle RSC — load next-auth từ node_modules thay vì chunk nội bộ lệch.
  experimental: {
    serverComponentsExternalPackages: ["next-auth"],
  },
};

module.exports = nextConfig; 