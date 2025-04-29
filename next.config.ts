import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com'],
    // Optionnellement, vous pouvez également ajouter des formats d'image autorisés
    formats: ['image/avif', 'image/webp'],
    // Si vous souhaitez configurer des tailles d'images prédéfinies (optionnel)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
