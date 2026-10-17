import { Suspense } from 'react';

import { ProjectsPage } from '@/views/projects';

const Home = () => {
  return (
    <Suspense>
      <ProjectsPage />
    </Suspense>
  );
};

export default Home;
