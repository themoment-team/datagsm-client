import { Suspense } from 'react';

import type { Metadata } from 'next';

import { ProjectRequestsPage } from '@/views/project-requests';

export const metadata: Metadata = {
  title: '프로젝트 심사',
};

const Page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectRequestsPage />
    </Suspense>
  );
};

export default Page;
