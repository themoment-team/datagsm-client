import { SECURITY_HEADER_ROUTES } from '@repo/shared/constants';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return SECURITY_HEADER_ROUTES;
  },
  async rewrites() {
    return [
      {
        source: '/api/server1/:path*',
        destination: `${process.env.NEXT_PUBLIC_WEB_SERVER_URL}/:path*`,
      },
      {
        source: '/api/server2/:path*',
        destination: `${process.env.NEXT_PUBLIC_OPENAPI_SERVER_URL}/:path*`,
      },
      {
        source: '/api/server3/:path*',
        destination: `${process.env.NEXT_PUBLIC_OAUTH_AUTH_SERVER_URL}/:path*`,
      },
      {
        source: '/api/server4/:path*',
        destination: `${process.env.NEXT_PUBLIC_OAUTH_RESOURCE_SERVER_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
