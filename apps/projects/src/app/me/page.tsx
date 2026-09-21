import { Suspense } from 'react';

import { MyProjectsPage } from '@/views/my-projects';

const MyProjectsRoute = () => {
  return (
    <Suspense>
      <MyProjectsPage />
    </Suspense>
  );
};

export default MyProjectsRoute;
