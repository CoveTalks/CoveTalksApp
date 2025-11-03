/** @type {import('next').NextConfig} */
const nextConfig = {
  // ========================================
  // VERCEL DEPLOYMENT - TURBOPACK ENABLED
  // ========================================
  
  // Turbopack is the default bundler in Next.js 16
  // It's 700x faster than Webpack for large apps
  
  // ========================================
  // DEVELOPMENT & PERFORMANCE
  // ========================================
  
  reactStrictMode: true,
  poweredByHeader: false,
  
  // ========================================
  // IMAGE OPTIMIZATION
  // ========================================
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'app.covetalks.com',
      },
      {
        protocol: 'https',
        hostname: 'covetalks.com',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app', // Add Vercel preview URLs
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // ========================================
  // EXPERIMENTAL FEATURES
  // ========================================
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: [
        'app.covetalks.com',
        'covetalks.com',
        'localhost:3001',
        '*.vercel.app', // Allow Vercel preview deployments
      ],
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
    ],
  },
  
  // ========================================
  // TURBOPACK CONFIGURATION
  // ========================================
  
  // Empty config enables Turbopack with defaults
  // Turbopack handles:
  // - Tree shaking
  // - Code splitting
  // - Hot Module Replacement (HMR)
  // - Incremental compilation
  turbopack: {},
  
  // ========================================
  // BUILD-TIME CHECKING
  // ========================================
  
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
  },
  
  // ========================================
  // SECURITY HEADERS
  // ========================================
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ]
  },
  
  // ========================================
  // REDIRECTS
  // ========================================
  
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/app',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
  
  // ========================================
  // PRODUCTION OPTIMIZATIONS
  // ========================================
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn', 'info'],
    } : false,
  },
  
  // ========================================
  // ENVIRONMENT VARIABLES (Public)
  // ========================================
  
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://app.covetalks.com',
    NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL || 'https://covetalks.com',
    NEXT_PUBLIC_APP_NAME: 'CoveTalks',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // ========================================
  // PAGE EXTENSIONS
  // ========================================
  
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'md', 'mdx'],
  
  // ========================================
  // TRAILING SLASH
  // ========================================
  
  trailingSlash: false,
  
  // ========================================
  // COMPRESSION
  // ========================================
  
  compress: true,
  
  // ========================================
  // LOGGING (Development)
  // ========================================
  
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

module.exports = nextConfig