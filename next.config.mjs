/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined

const nextConfig = {
  output: 'standalone',
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath || '',
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
}

export default nextConfig
