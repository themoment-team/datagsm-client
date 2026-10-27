import { SECURITY_HEADER_ROUTES } from '@repo/shared/constants';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return SECURITY_HEADER_ROUTES;
  },
};

export default nextConfig;
