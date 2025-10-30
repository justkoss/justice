/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['fr', 'ar'],
    defaultLocale: 'fr',
    localeDetection: true,
  },
  images: {
    domains: ['localhost'],
  },
  // Disable server-side rendering for certain pages if needed
  experimental: {
    appDir: true,
  },
  // Configure environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig
