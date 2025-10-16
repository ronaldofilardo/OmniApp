import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile workspace packages
  transpilePackages: ['shared'],
  
  // Output configuration for Vercel
  output: 'standalone',

  // Timeout configuration for Vercel free tier (10 seconds max)
  experimental: {
    optimizePackageImports: ['phosphor-react'],
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ]
  },
  
  // Configuração experimental para melhor performance
  experimental: {
    optimizePackageImports: ['phosphor-react'],
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
};

export default nextConfig;
