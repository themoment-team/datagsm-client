import createMDX from '@next/mdx';
import { SECURITY_HEADERS } from '@repo/shared/constants';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/shared'],

  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm'],
  },
});

export default withMDX(nextConfig);
