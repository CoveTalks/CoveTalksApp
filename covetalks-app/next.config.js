/** @type {import('next').NextConfig} */
const nextConfig = {
  // ========================================
  // NETLIFY DEPLOYMENT CONFIGURATION
  // ========================================
  
  // Use Webpack for production builds (Turbopack for dev only)
  // Turbopack is not fully compatible with Netlify yet
  
  // ========================================
  // DEVELOPMENT & PERFORMANCE
  // ========================================
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Remove X-Powered-By header for security
  poweredByHeader: false,
  
  // ========================================
  // IMAGE OPTIMIZATION
  // ========================================
  
  images: {
    // Remote patterns for external images (Next.js 16+ only supports remotePatterns)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile images
      },
      {
        protocol: 'https',
        hostname: 'app.covetalks.com',
      },
      {
        protocol: 'https',
        hostname: 'covetalks.com',
      },
    ],
    
    // Modern image formats for better performance
    formats: ['image/avif', 'image/webp'],
    
    // Image optimization settings
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // ========================================
  // EXPERIMENTAL FEATURES
  // ========================================
  
  experimental: {
    // Enable server actions for form handling
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: [
        'app.covetalks.com',
        'covetalks.com',
        'localhost:3001',
      ],
    },
    
    // Optimize package imports (reduces bundle size)
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
    ],
  },
  
  // ========================================
  // BUILD-TIME CHECKING
  // ========================================
  
  // TypeScript configuration
  typescript: {
    // Fail build on TypeScript errors (recommended for production)
    ignoreBuildErrors: false,
    
    // Use project tsconfig.json
    tsconfigPath: './tsconfig.json',
  },
  
  // ========================================
  // WEBPACK CONFIGURATION
  // ========================================
  
  // Ensure Webpack is used for production builds
  webpack: (config, { isServer }) => {
    return config
  },
  
  // ========================================
  // SECURITY HEADERS
  // ========================================
  
  async headers() {
    return [
      {
        // Apply to all routes
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
        // API routes should never be cached
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
        // Redirect root to dashboard for authenticated users
        // (The actual auth check happens in middleware)
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
      {
        // Legacy URL compatibility
        source: '/app',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
  
  // ========================================
  // PRODUCTION OPTIMIZATIONS
  // ========================================
  
  // Compiler optimizations (compatible with Webpack)
  compiler: {
    // Remove console.log in production (keep errors and warnings)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn', 'info'],
    } : false,
  },
  
  // ========================================
  // ENVIRONMENT VARIABLES (Public)
  // ========================================
  
  // These are exposed to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://app.covetalks.com',
    NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL || 'https://covetalks.com',
    NEXT_PUBLIC_APP_NAME: 'CoveTalks',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // ========================================
  // PAGE EXTENSIONS
  // ========================================
  
  // Files that should be treated as pages
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'md', 'mdx'],
  
  // ========================================
  // TRAILING SLASH
  // ========================================
  
  // Don't add trailing slashes to URLs
  trailingSlash: false,
  
  // ========================================
  // COMPRESSION
  // ========================================
  
  // Enable gzip compression (Netlify handles this, but good to have)
  compress: true,
  
  // ========================================
  // LOGGING (Development)
  // ========================================
  
  // Better logging in development
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

module.exports = nextConfig